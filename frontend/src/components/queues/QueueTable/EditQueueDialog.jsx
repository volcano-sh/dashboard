import React, { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";
import apiClient, { API_ENDPOINTS } from "../../../config/api";

const RenderFields = ({ data, onChange, path = [] }) =>
    Object.entries(data || {}).map(([key, value]) => {
        if (key === "managedFields" || key.startsWith("f:")) return null;

        const currentPath = [...path, key];

        if (Array.isArray(value)) {
            return (
                <Box
                    key={currentPath.join(".")}
                    sx={{ mb: 2, pl: 2, borderLeft: "2px solid #ccc" }}
                >
                    <Typography variant="subtitle2">{key} (Array)</Typography>
                    {value.map((item, index) => {
                        const itemPath = [...currentPath, index];
                        if (typeof item === "object" && item !== null) {
                            return (
                                <Box
                                    key={itemPath.join(".")}
                                    sx={{
                                        pl: 2,
                                        mb: 1,
                                        borderLeft: "1px dashed #999",
                                    }}
                                >
                                    <Typography variant="caption">
                                        Item {index}
                                    </Typography>
                                    <RenderFields
                                        data={item}
                                        onChange={onChange}
                                        path={itemPath}
                                    />
                                </Box>
                            );
                        }
                        return (
                            <TextField
                                key={itemPath.join(".")}
                                label={`${key}[${index}]`}
                                value={item}
                                fullWidth
                                margin="dense"
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val === "true") val = true;
                                    else if (val === "false") val = false;
                                    else if (!isNaN(val) && val.trim() !== "")
                                        val = Number(val);
                                    onChange(itemPath, val);
                                }}
                            />
                        );
                    })}
                </Box>
            );
        }

        if (typeof value === "object" && value !== null) {
            return (
                <Box
                    key={currentPath.join(".")}
                    sx={{ mb: 2, pl: 2, borderLeft: "2px solid #ccc" }}
                >
                    <Typography variant="subtitle2">{key}</Typography>
                    <RenderFields
                        data={value}
                        onChange={onChange}
                        path={currentPath}
                    />
                </Box>
            );
        }

        if (typeof value === "boolean") {
            return (
                <FormControlLabel
                    key={currentPath.join(".")}
                    control={
                        <Checkbox
                            checked={value}
                            onChange={(e) =>
                                onChange(currentPath, e.target.checked)
                            }
                        />
                    }
                    label={currentPath.join(".")}
                    sx={{ mb: 1 }}
                />
            );
        }

        return (
            <TextField
                key={currentPath.join(".")}
                label={currentPath.join(".")}
                value={value}
                fullWidth
                margin="dense"
                onChange={(e) => {
                    let val = e.target.value;
                    if (val === "true") val = true;
                    else if (val === "false") val = false;
                    else if (!isNaN(val) && val.trim() !== "")
                        val = Number(val);
                    onChange(currentPath, val);
                }}
            />
        );
    });

const updateNestedValue = (obj, path, value) => {
    const newObj = { ...obj };
    let current = newObj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current)) current[key] = {};
        current = current[key];
    }
    current[path[path.length - 1]] = value;
    return newObj;
};

const EditQueueDialog = ({ open, queue, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");
    const [formState, setFormState] = useState({});
    const [saving, setSaving] = useState(false);

    const skipYamlUpdate = useRef(false);
    const skipFormUpdate = useRef(false);

    useEffect(() => {
        if (open && queue) {
            const dumpedYaml = yaml.dump(queue);
            setEditorValue(dumpedYaml);
            setFormState(queue);
            setEditMode("yaml");
        }
    }, [open, queue]);

    useEffect(() => {
        if (skipYamlUpdate.current) {
            skipYamlUpdate.current = false;
            return;
        }
        try {
            const parsed = yaml.load(editorValue) || {};
            skipFormUpdate.current = true;
            setFormState(parsed);
        } catch {
            // Ignore YAML parse errors, keep old formState
        }
    }, [editorValue]);

    useEffect(() => {
        if (skipFormUpdate.current) {
            skipFormUpdate.current = false;
            return;
        }
        try {
            const dumped = yaml.dump(formState);
            skipYamlUpdate.current = true;
            setEditorValue(dumped);
        } catch {
            // Ignore errors
        }
    }, [formState]);

    const handleModeChange = (_, newMode) => {
        if (!newMode) return;
        setEditMode(newMode);
    };

    const handleNestedChange = (path, value) => {
        setFormState((prev) => updateNestedValue(prev, path, value));
    };

    const handleSave = async () => {
        try {
            const updated =
                editMode === "yaml" ? yaml.load(editorValue) : formState;

            if (!updated?.metadata?.name) {
                throw new Error("Queue metadata.name is missing");
            }

            if (!updated.spec || Object.keys(updated.spec).length === 0) {
                throw new Error("Queue spec is empty or missing");
            }

            setSaving(true);

            const response = await apiClient.put(
                API_ENDPOINTS.queues.detail(updated.metadata.name),
                { spec: updated.spec },
            );

            const responseData = response.data;

            const fullUpdatedQueue = {
                ...updated,
                spec: responseData.spec || updated.spec,
            };

            skipFormUpdate.current = true;
            setFormState(fullUpdatedQueue);
            skipYamlUpdate.current = true;
            setEditorValue(yaml.dump(fullUpdatedQueue));

            if (typeof onSave === "function") {
                onSave(responseData);
            }

            onClose();
        } catch (err) {
            console.error("Save failed:", err);
            const errMsg =
                err.response?.data?.details ||
                err.response?.data?.message ||
                err.message ||
                "Failed to save";
            alert(errMsg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                Edit Queue
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                >
                    <ToggleButton value="yaml">YAML</ToggleButton>
                    <ToggleButton value="form">Form</ToggleButton>
                </ToggleButtonGroup>
            </DialogTitle>

            <DialogContent sx={{ height: 500 }}>
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
                    <Box sx={{ mt: 2 }}>
                        <RenderFields
                            data={formState}
                            onChange={handleNestedChange}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    color="primary"
                    variant="contained"
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving && <CircularProgress size={18} />}
                >
                    {saving ? "Updating…" : "Update"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditQueueDialog;
