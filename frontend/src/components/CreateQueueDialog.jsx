import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    FormControlLabel,
    Checkbox,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from "@mui/material";
import { Button } from "react-bootstrap";
import { Plus, Minus, ChevronDown } from "lucide-react";

const primaryColor = "#E34C26";

const CreateQueueDialog = ({ open, onClose, onCreate }) => {
    const [queueData, setQueueData] = useState({
        name: "",
        weight: "",
        reclaimable: true,
        guaranteed: { cpu: "", memory: "", scalars: [] },
        capability: { cpu: "", memory: "", scalars: [] },
        deserved: { cpu: "", memory: "", scalars: [] },
    });
    const [expanded, setExpanded] = useState({});
    const [errors, setErrors] = useState({});

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

    const validate = () => {
        let newErrors = {};
        if (!queueData.name.trim()) newErrors.name = "Queue name is required";
        if (
            !queueData.weight ||
            isNaN(queueData.weight) ||
            parseInt(queueData.weight) < 1
        )
            newErrors.weight = "Weight is required and must be positive";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const specSection = {
            weight: parseInt(queueData.weight, 10),
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

        const newQueue = {
            apiVersion: "scheduling.volcano.sh/v1beta1",
            kind: "Queue",
            metadata: { name: queueData.name.trim() },
            spec: specSection,
        };

        onCreate(newQueue);
        setQueueData({
            name: "",
            weight: "",
            reclaimable: false,
            guaranteed: { cpu: "", memory: "", scalars: [] },
            capability: { cpu: "", memory: "", scalars: [] },
            deserved: { cpu: "", memory: "", scalars: [] },
        });
        setExpanded({});
        setErrors({});
        onClose();
    };

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
                    color: primaryColor,
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    pb: 1,
                    letterSpacing: "0.5px",
                }}
            >
                Create Queue
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        mt: 1,
                    }}
                >
                    <TextField
                        required
                        label="Queue Name"
                        value={queueData.name}
                        onChange={handleChange("name")}
                        fullWidth
                        sx={tfStyle}
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Weight *"
                        type="number"
                        value={queueData.weight}
                        onChange={handleChange("weight")}
                        fullWidth
                        sx={tfStyle}
                        error={!!errors.weight}
                        helperText={errors.weight}
                        inputProps={{ min: 1 }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={queueData.reclaimable}
                                onChange={handleCheckboxChange}
                                sx={{
                                    color: primaryColor,
                                    "&.Mui-checked": { color: primaryColor },
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
                    {errors.reclaimable && (
                        <Typography color="error" sx={{ ml: 1, fontSize: 13 }}>
                            {errors.reclaimable}
                        </Typography>
                    )}
                    {["guaranteed", "capability", "deserved"].map(
                        renderResourceSection,
                    )}
                </Box>
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
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    style={{
                        backgroundColor: primaryColor,
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        borderRadius: 7,
                        minWidth: 110,
                        boxShadow: "0 3px 10px 0 rgba(227,76,38,0.14)",
                        transition: "all 0.2s",
                    }}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateQueueDialog;
