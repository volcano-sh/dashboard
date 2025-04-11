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

    const [loading, setLoading] = useState(false); // Add loading state
    const handleSave = async () => {
        try {
            setLoading(true);
    
            const updatedQueue = yaml.load(editorValue);
            console.log("Updating queue:", updatedQueue);
    
            const response = await fetch(`/api/queues/${namespace}/${queueName}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedQueue),
            });
    
            if (!response.ok) {
                throw new Error(await response.text());
            }
    
            // Force UI refresh
            onSave(updatedQueue); // Ensure UI gets updated
            window.location.reload(); // Temporary fix to see if it updates
    
            onClose();
        } catch (error) {
            console.error("Update failed:", error);
            alert(error.message);
        } finally {
            setLoading(false);
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
                    disabled={loading} // Disable button while updating
>
    {loading ? "Updating..." : "Update"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditQueueDialog;
