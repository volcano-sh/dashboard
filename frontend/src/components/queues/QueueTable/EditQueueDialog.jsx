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

const EditQueueDialog = ({ open, queue, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");

    useEffect(() => {
        if (open && queue) {
            const content = yaml.dump(queue); // Always YAML
            setEditorValue(content);
        }
    }, [open, queue]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setEditMode(newMode); // Only for syntax highlighting
        }
    };

    const handleSave = () => {
        try {
            const updatedQueue = yaml.load(editorValue); // Always parse as YAML
            onSave(updatedQueue);
            onClose();
        } catch (error) {
            console.error("Error parsing edited content:", error);
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
                Edit Queue
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
                    language={editMode} // only affects syntax highlighting
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

export default EditQueueDialog;
