import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const RenderFields = ({ data, onChange, path = [] }) => {
    return Object.entries(data || {}).map(([key, value]) => {
        // Skip internal Kubernetes metadata
        if (key === "managedFields" || key.startsWith("f:")) {
            return null;
        }

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
                        } else {
                            return (
                                <TextField
                                    key={itemPath.join(".")}
                                    label={`${key}[${index}]`}
                                    value={item}
                                    fullWidth
                                    margin="dense"
                                    onChange={(e) =>
                                        onChange(itemPath, e.target.value)
                                    }
                                />
                            );
                        }
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

        return (
            <TextField
                key={currentPath.join(".")}
                label={currentPath.join(".")}
                value={value}
                fullWidth
                margin="dense"
                onChange={(e) => onChange(currentPath, e.target.value)}
            />
        );
    });
};

const updateNestedValue = (obj, path, value) => {
    const lastKey = path.pop();
    const nested = path.reduce((acc, key) => (acc[key] = acc[key] || {}), obj);
    nested[lastKey] = value;
    return { ...obj };
};

const EditQueueDialog = ({ open, queue, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");
    const [formState, setFormState] = useState({});

    useEffect(() => {
        if (open && queue) {
            const yamlContent = yaml.dump(queue);
            setEditorValue(yamlContent);
            setFormState(queue);
            setEditMode("yaml");
        }
    }, [open, queue]);

    const handleModeChange = (event, newMode) => {
        if (!newMode) return;
        if (newMode === "form") {
            try {
                const parsed = yaml.load(editorValue);
                setFormState(parsed || {});
                setEditMode("form");
            } catch (err) {
                alert("Invalid YAML. Cannot switch to Form view.");
            }
        } else if (newMode === "yaml") {
            setEditorValue(yaml.dump(formState));
            setEditMode("yaml");
        }
    };

    const handleNestedChange = (path, value) => {
        setFormState((prev) =>
            updateNestedValue({ ...prev }, [...path], value),
        );
    };

    const handleSave = () => {
        try {
            const updated =
                editMode === "yaml" ? yaml.load(editorValue) : formState;
            onSave(updated);
            onClose();
        } catch (error) {
            console.error("Invalid YAML:", error);
            alert("Invalid YAML format.");
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
                <Button onClick={onClose} color="primary" variant="contained">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                >
                    Update
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditQueueDialog;
