import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const PodEditDialog = ({ open, pod, onClose, onSave, error, isSaving }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");
    const [formState, setFormState] = useState(null);
    const [localError, setLocalError] = useState("");

    const updateNestedValue = (obj, path, value) => {
        const next = yaml.load(yaml.dump(obj));
        let current = next;

        for (let index = 0; index < path.length - 1; index += 1) {
            const key = path[index];
            if (current[key] === undefined || current[key] === null) {
                current[key] = typeof path[index + 1] === "number" ? [] : {};
            }
            current = current[key];
        }

        current[path[path.length - 1]] = value;
        return next;
    };

    const extractFormState = (podValue) => {
        return yaml.load(yaml.dump(podValue));
    };

    useEffect(() => {
        if (open && pod) {
            setEditorValue(yaml.dump(pod));
            setFormState(extractFormState(pod));
            setEditMode("yaml");
            setLocalError("");
        }
    }, [open, pod]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            if (newMode === "form") {
                try {
                    const parsed = yaml.load(editorValue);
                    setFormState(parsed);
                    setLocalError("");
                } catch {
                    setLocalError("Unable to switch to form view because the YAML is invalid.");
                    return;
                }
            }

            if (newMode === "yaml" && formState) {
                setEditorValue(yaml.dump(formState));
            }

            setEditMode(newMode);
        }
    };

    const handleSave = async () => {
        try {
            const updatedPod =
                editMode === "yaml" ? yaml.load(editorValue) : formState;

            if (!updatedPod?.metadata?.name || !updatedPod?.metadata?.namespace) {
                setLocalError("Pod metadata.name and metadata.namespace are required.");
                return;
            }

            if (pod?.metadata?.name && updatedPod.metadata.name !== pod.metadata.name) {
                setLocalError(
                    `Pod rename is not supported. Original name: ${pod.metadata.name}. Keep metadata.name unchanged.`,
                );
                return;
            }

            if (
                pod?.metadata?.namespace &&
                updatedPod.metadata.namespace !== pod.metadata.namespace
            ) {
                setLocalError(
                    `Pod namespace change is not supported for this update flow. Original namespace: ${pod.metadata.namespace}.`,
                );
                return;
            }

            setLocalError("");
            const result = await onSave(updatedPod);

            if (result !== false) {
                onClose();
            }
        } catch (err) {
            console.error("Save failed:", err);
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
                Edit Pod
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                    color="primary"
                >
                    <ToggleButton value="yaml">YAML</ToggleButton>
                    <ToggleButton value="form">Form</ToggleButton>
                </ToggleButtonGroup>
            </DialogTitle>
            <DialogContent sx={{ height: "500px" }}>
                {(localError || error) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {localError || error}
                    </Alert>
                )}
                {editMode === "yaml" ? (
                    <Editor
                        height="100%"
                        language="yaml"
                        value={editorValue}
                        onChange={(val) => setEditorValue(val || "")}
                        options={{
                            minimap: { enabled: false },
                            automaticLayout: true,
                        }}
                    />
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="metadata.name"
                            value={formState?.metadata?.name || ""}
                            onChange={(event) =>
                                setFormState((current) =>
                                    updateNestedValue(
                                        current,
                                        ["metadata", "name"],
                                        event.target.value,
                                    ),
                                )
                            }
                            fullWidth
                        />
                        <TextField
                            label="metadata.namespace"
                            value={formState?.metadata?.namespace || ""}
                            onChange={(event) =>
                                setFormState((current) =>
                                    updateNestedValue(
                                        current,
                                        ["metadata", "namespace"],
                                        event.target.value,
                                    ),
                                )
                            }
                            fullWidth
                        />
                        <TextField
                            label="spec.containers[0].name"
                            value={formState?.spec?.containers?.[0]?.name || ""}
                            onChange={(event) =>
                                setFormState((current) =>
                                    updateNestedValue(
                                        current,
                                        ["spec", "containers", 0, "name"],
                                        event.target.value,
                                    ),
                                )
                            }
                            fullWidth
                        />
                        <TextField
                            label="spec.containers[0].image"
                            value={formState?.spec?.containers?.[0]?.image || ""}
                            onChange={(event) =>
                                setFormState((current) =>
                                    updateNestedValue(
                                        current,
                                        ["spec", "containers", 0, "image"],
                                        event.target.value,
                                    ),
                                )
                            }
                            fullWidth
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    color="primary"
                    variant="contained"
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                    disabled={isSaving}
                >
                    {isSaving ? "Updating..." : "Update"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PodEditDialog;