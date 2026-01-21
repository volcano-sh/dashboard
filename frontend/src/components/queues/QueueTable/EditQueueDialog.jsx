import React, { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    Box,
    Typography,
    Checkbox,
    FormControlLabel,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
} from "@mui/material";
import { Button } from "react-bootstrap";
import { Plus, Minus, ChevronDown } from "lucide-react";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const primaryColor = "#E34C26";

const updateNestedValue = (obj, path, value) => {
    const result = JSON.parse(JSON.stringify(obj));
    const lastKey = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    let current = result;
    for (const key of parentPath) {
        if (!current[key]) current[key] = {};
        current = current[key];
    }
    current[lastKey] = value;
    return result;
};

const EditQueueDialog = ({ open, queue, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");
    const [queueData, setQueueData] = useState({
        name: "",
        weight: "",
        reclaimable: true,
        guaranteed: { cpu: "", memory: "", scalars: [] },
        capability: { cpu: "", memory: "", scalars: [] },
        deserved: { cpu: "", memory: "", scalars: [] },
    });
    const [expanded, setExpanded] = useState({});
    const [saving, setSaving] = useState(false);

    // Refs to avoid infinite loops when syncing form & YAML
    const skipYamlUpdate = useRef(false);
    const skipFormUpdate = useRef(false);

    // Load initial data on open
    useEffect(() => {
        if (open && queue) {
            const yamlContent = yaml.dump(queue);
            setEditorValue(yamlContent);
            const spec = queue.spec || {};
            const formData = {
                name: queue.metadata?.name || "",
                weight: spec.weight?.toString() || "",
                reclaimable:
                    spec.reclaimable !== undefined ? spec.reclaimable : true,
                guaranteed: convertResourceToForm(spec.guaranteed),
                capability: convertResourceToForm(spec.capability),
                deserved: convertResourceToForm(spec.deserved),
            };
            setQueueData(formData);
            const newExpanded = {};
            if (spec.guaranteed && Object.keys(spec.guaranteed).length > 0)
                newExpanded.guaranteed = true;
            if (spec.capability && Object.keys(spec.capability).length > 0)
                newExpanded.capability = true;
            if (spec.deserved && Object.keys(spec.deserved).length > 0)
                newExpanded.deserved = true;
            setExpanded(newExpanded);
            setEditMode("yaml");
        }
    }, [open, queue]);

    const convertResourceToForm = (resource) => {
        if (!resource) return { cpu: "", memory: "", scalars: [] };
        const scalars = [];
        const result = { cpu: "", memory: "", scalars };
        Object.entries(resource).forEach(([key, value]) => {
            if (key === "cpu") {
                result.cpu = value.toString();
            } else if (key === "memory") {
                result.memory = value.toString();
            } else {
                scalars.push({ key, value: value.toString() });
            }
        });
        return result;
    };

    // -- PATCH #1: Sync form changes to YAML in real-time --
    useEffect(() => {
        if (editMode === "form") {
            if (skipYamlUpdate.current) {
                skipYamlUpdate.current = false;
                return;
            }
            const updatedQueue = convertFormToQueue();
            skipFormUpdate.current = true;
            setEditorValue(yaml.dump(updatedQueue));
        }
        // eslint-disable-next-line
    }, [queueData, editMode]);
    // ------------------------------------------------------

    const handleModeChange = (event, newMode) => {
        if (!newMode) return;
        if (newMode === "form") {
            try {
                const parsed = yaml.load(editorValue);
                if (parsed) {
                    skipYamlUpdate.current = true; // PATCH #2: Prevents sync loop!
                    const spec = parsed.spec || {};
                    const formData = {
                        name: parsed.metadata?.name || "",
                        weight: spec.weight?.toString() || "",
                        reclaimable:
                            spec.reclaimable !== undefined
                                ? spec.reclaimable
                                : true,
                        guaranteed: convertResourceToForm(spec.guaranteed),
                        capability: convertResourceToForm(spec.capability),
                        deserved: convertResourceToForm(spec.deserved),
                    };
                    setQueueData(formData);
                    const newExpanded = {};
                    if (
                        spec.guaranteed &&
                        Object.keys(spec.guaranteed).length > 0
                    )
                        newExpanded.guaranteed = true;
                    if (
                        spec.capability &&
                        Object.keys(spec.capability).length > 0
                    )
                        newExpanded.capability = true;
                    if (spec.deserved && Object.keys(spec.deserved).length > 0)
                        newExpanded.deserved = true;
                    setExpanded(newExpanded);
                }
                setEditMode("form");
            } catch (err) {
                alert("Invalid YAML. Cannot switch to Form view.");
            }
        } else if (newMode === "yaml") {
            const updatedQueue = convertFormToQueue();
            setEditorValue(yaml.dump(updatedQueue));
            setEditMode("yaml");
        }
    };

    const convertFormToQueue = () => {
        const specSection = {
            weight: parseInt(queueData.weight, 10) || 1,
            reclaimable: queueData.reclaimable,
        };
        ["guaranteed", "capability", "deserved"].forEach((section) => {
            const cpu = queueData[section].cpu.trim();
            const memory = queueData[section].memory.trim();
            const scalars = queueData[section].scalars || [];
            const hasStandard = cpu || memory;
            const hasScalars = scalars.some(
                ({ key, value }) => key.trim() && value.trim(),
            );
            if (hasStandard || hasScalars) {
                specSection[section] = {};
                if (cpu) specSection[section].cpu = cpu;
                if (memory) specSection[section].memory = memory;
                scalars.forEach(({ key, value }) => {
                    if (key.trim() && value.trim()) {
                        specSection[section][key.trim()] = value.trim();
                    }
                });
            }
        });
        return {
            ...queue,
            metadata: {
                ...queue.metadata,
                name: queueData.name.trim(),
            },
            spec: specSection,
        };
    };

    const handleChange = (field) => (event) => {
        let value = event.target.value;
        if (field === "weight") value = value.replace(/\D/, "");
        setQueueData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (event) => {
        setQueueData((prev) => ({
            ...prev,
            reclaimable: event.target.checked,
        }));
    };

    const addScalar = (section) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                scalars: [...prev[section].scalars, { key: "", value: "" }],
            },
        }));
    };

    const removeScalar = (section, idx) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                scalars: prev[section].scalars.filter((_, i) => i !== idx),
            },
        }));
    };

    const handleScalarChange = (section, idx, field) => (event) => {
        const newScalars = [...queueData[section].scalars];
        newScalars[idx][field] = event.target.value;
        setQueueData((prev) => ({
            ...prev,
            [section]: { ...prev[section], scalars: newScalars },
        }));
    };

    const handleResourceChange = (section, key) => (event) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: { ...prev[section], [key]: event.target.value },
        }));
    };

    const handleAccordionChange = (section) => (event, isExpanded) => {
        setExpanded((prev) => ({
            ...prev,
            [section]: isExpanded,
        }));
    };

    // ----------- MODIFIED handleSave with API call ----------
    const handleSave = async () => {
        try {
            setSaving(true);
            let updated;
            if (editMode === "yaml") {
                updated = yaml.load(editorValue);
            } else {
                updated = convertFormToQueue();
            }

            if (!updated?.metadata?.name) {
                throw new Error("Queue name (metadata.name) is required.");
            }
            if (!updated?.spec || Object.keys(updated.spec).length === 0) {
                throw new Error("Queue spec section is required.");
            }

            // --- API Call for update ---
            const resp = await fetch(`/api/queues/${updated.metadata.name}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ spec: updated.spec }),
            });

            if (!resp.ok) {
                const errText = resp.headers
                    .get("content-type")
                    ?.includes("application/json")
                    ? (await resp.json()).details || "Unknown error"
                    : await resp.text();
                throw new Error(errText);
            }

            const responseData = await resp.json();

            // Optionally, update editor/form state with server's returned data
            setEditorValue(
                yaml.dump({
                    ...updated,
                    spec: responseData.spec || updated.spec,
                }),
            );
            setQueueData((prev) => ({ ...prev, ...updated }));

            if (typeof onSave === "function") onSave(responseData);

            onClose();
        } catch (error) {
            alert(error.message || "Failed to update queue.");
        } finally {
            setSaving(false);
        }
    };
    // --------------------------------------------------------

    const tfStyle = {
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
                borderColor: primaryColor,
            },
        "& .MuiInputLabel-root.Mui-focused": { color: primaryColor },
    };

    const renderResourceSection = (section) => (
        <Accordion
            key={section}
            expanded={!!expanded[section]}
            onChange={handleAccordionChange(section)}
            sx={{
                boxShadow: "none",
                border: "1px solid #ececec",
                mb: 1.5,
                "& .MuiAccordionSummary-root": { minHeight: 0 },
                "& .MuiAccordionSummary-content": {
                    color: "#555",
                    fontWeight: 500,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ChevronDown size={18} color="#888" />}
            >
                <Typography sx={{ fontWeight: 500 }}>
                    {section.charAt(0).toUpperCase() + section.slice(1)}{" "}
                    Resources (Optional)
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                        label="CPU"
                        value={queueData[section].cpu}
                        onChange={handleResourceChange(section, "cpu")}
                        fullWidth
                        placeholder="e.g. 1000m"
                        sx={tfStyle}
                    />
                    <TextField
                        label="Memory"
                        value={queueData[section].memory}
                        onChange={handleResourceChange(section, "memory")}
                        fullWidth
                        placeholder="e.g. 1Gi"
                        sx={tfStyle}
                    />
                </Box>
                <Box sx={{ ml: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Box
                            sx={{
                                fontWeight: 500,
                                color: "#666",
                                flexGrow: 2,
                                fontSize: "0.9rem",
                            }}
                        >
                            Custom Scalar Resources
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => addScalar(section)}
                            sx={{
                                color: primaryColor,
                                bgcolor: "white",
                                "&:hover": {
                                    bgcolor: "#f7f7f7",
                                    color: primaryColor,
                                },
                            }}
                        >
                            <Plus size={18} />
                        </IconButton>
                    </Box>
                    {queueData[section].scalars.map((scalar, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "flex",
                                gap: 2,
                                mb: 1,
                                alignItems: "center",
                            }}
                        >
                            <TextField
                                label="Key"
                                value={scalar.key}
                                onChange={handleScalarChange(
                                    section,
                                    idx,
                                    "key",
                                )}
                                fullWidth
                                placeholder="e.g. nvidia.com/gpu"
                                sx={tfStyle}
                                size="small"
                            />
                            <TextField
                                label="Value"
                                value={scalar.value}
                                onChange={handleScalarChange(
                                    section,
                                    idx,
                                    "value",
                                )}
                                fullWidth
                                placeholder="e.g. 1"
                                sx={tfStyle}
                                size="small"
                            />
                            <IconButton
                                size="small"
                                onClick={() => removeScalar(section, idx)}
                                sx={{
                                    color: "#fff",
                                    bgcolor: "#dc3545",
                                    "&:hover": {
                                        bgcolor: "#c82333",
                                        color: "#fff",
                                    },
                                    ml: 1,
                                }}
                            >
                                <Minus size={16} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                style: {
                    borderRadius: "14px",
                    boxShadow: "0 10px 32px rgba(227,76,38,0.16)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: primaryColor,
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    pb: 1,
                    letterSpacing: "0.5px",
                }}
            >
                Edit Queue
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                    sx={{
                        "& .MuiToggleButton-root": {
                            color: primaryColor,
                            borderColor: primaryColor,
                            "&.Mui-selected": {
                                backgroundColor: primaryColor,
                                color: "white",
                                "&:hover": {
                                    backgroundColor: primaryColor,
                                },
                            },
                        },
                    }}
                >
                    <ToggleButton value="yaml">YAML</ToggleButton>
                    <ToggleButton value="form">Form</ToggleButton>
                </ToggleButtonGroup>
            </DialogTitle>

            <DialogContent sx={{ height: 500, overflow: "auto", p: 0 }}>
                {editMode === "yaml" ? (
                    <Editor
                        height="100%"
                        language="yaml"
                        value={editorValue}
                        onChange={(v) => setEditorValue(v || "")}
                        options={{
                            minimap: { enabled: false },
                            automaticLayout: true,
                        }}
                    />
                ) : (
                    <Box sx={{ height: "100%", overflow: "auto", p: 3 }}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                            }}
                        >
                            <TextField
                                required
                                label="Queue Name"
                                value={queueData.name}
                                onChange={handleChange("name")}
                                fullWidth
                                sx={tfStyle}
                            />
                            <TextField
                                label="Weight *"
                                type="number"
                                value={queueData.weight}
                                onChange={handleChange("weight")}
                                fullWidth
                                sx={tfStyle}
                                inputProps={{ min: 1 }}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={queueData.reclaimable}
                                        onChange={handleCheckboxChange}
                                        sx={{
                                            color: primaryColor,
                                            "&.Mui-checked": {
                                                color: primaryColor,
                                            },
                                        }}
                                    />
                                }
                                label="Reclaimable"
                                sx={{
                                    ".MuiTypography-root": {
                                        fontWeight: 500,
                                        color: "#222",
                                    },
                                }}
                            />
                            {["guaranteed", "capability", "deserved"].map(
                                renderResourceSection,
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <Button
                    onClick={onClose}
                    style={{
                        backgroundColor: "#f4f4f4",
                        color: primaryColor,
                        border: "1.5px solid " + primaryColor,
                        fontWeight: 600,
                        borderRadius: 7,
                        minWidth: 110,
                        transition: "all 0.2s",
                    }}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    style={{
                        backgroundColor: primaryColor,
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        borderRadius: 7,
                        minWidth: 110,
                        boxShadow: "0 3px 10px 0 rgba(227,76,38,0.14)",
                        transition: "all 0.2s",
                        position: "relative",
                    }}
                    disabled={saving}
                >
                    {saving && (
                        <CircularProgress
                            size={18}
                            sx={{
                                color: "#fff",
                                position: "absolute",
                                left: 16,
                                top: "50%",
                                marginTop: "-9px",
                            }}
                        />
                    )}
                    {saving ? "Updating…" : "Update"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditQueueDialog;
