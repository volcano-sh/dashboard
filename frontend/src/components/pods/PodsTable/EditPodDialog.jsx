import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const EditPodDialog = ({ open, pod, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");

    useEffect(() => {
        if (open && pod) {
            const content = yaml.dump(pod); // Always YAML format for editing
            setEditorValue(content);
        }
    }, [open, pod]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setEditMode(newMode); // For syntax highlighting (only yaml here)
        }
    };

    const handleSave = () => {
        try {
            const updatedPod = yaml.load(editorValue); // Parse edited YAML back to object
            onSave(updatedPod);
            onClose();
        } catch (error) {
            console.error("Error parsing edited pod YAML:", error);
            alert("Invalid YAML format. Please check your input.");
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
                </ToggleButtonGroup>
            </DialogTitle>
            <DialogContent sx={{ height: "500px" }}>
                <Editor
                    height="100%"
                    language={editMode}
                    value={editorValue}
                    onChange={(value) => setEditorValue(value || "")}
                    options={{
                        minimap: { enabled: false },
                        automaticLayout: true,
                    }}
                />
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

export default EditPodDialog;
