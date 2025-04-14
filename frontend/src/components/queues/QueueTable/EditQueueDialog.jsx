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

    const convertContent = (content, fromMode, toMode) => {
        try {
            if (fromMode === "yaml" && toMode === "json") {
                const parsedContent = yaml.load(content);
                return JSON.stringify(parsedContent, null, 2);
            } else if (fromMode === "json" && toMode === "yaml") {
                const parsedContent = JSON.parse(content);
                return yaml.dump(parsedContent);
            }
            return content;
        } catch (error) {
            console.error("Conversion error:", error);
            alert("Error converting content. Please check your input.");
            return content;
        }
    };

    useEffect(() => {
        if (open && queue) {
            const content =
                editMode === "yaml"
                    ? yaml.dump(queue)
                    : JSON.stringify(queue, null, 2);
            setEditorValue(content);
        }
    }, [open, queue, editMode]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            const convertedContent = convertContent(
                editorValue,
                editMode,
                newMode,
            );
            setEditMode(newMode);
            setEditorValue(convertedContent);
        }
    };

    const handleSave = () => {
        try {
            const updatedQueue =
                editMode === "yaml"
                    ? yaml.load(editorValue)
                    : JSON.parse(editorValue);

            onSave(updatedQueue);
            onClose();
        } catch (error) {
            console.error("Error parsing edited content:", error);
            alert("Invalid YAML/JSON format. Please check your input.");
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
                    <ToggleButton value="json">JSON</ToggleButton>
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

export default EditQueueDialog;
