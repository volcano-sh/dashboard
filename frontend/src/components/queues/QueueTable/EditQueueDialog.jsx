import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    Box,
    CircularProgress,
    Alert,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const EditQueueDialog = ({ open, queue, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");
    const [loading, setLoading] = useState(false);
    const [editorError, setEditorError] = useState(null);

    useEffect(() => {
        if (open && queue) {
            try {
                // Make a clean copy of the queue without status field
                const queueForEdit = JSON.parse(JSON.stringify(queue));
                if (queueForEdit.status) {
                    delete queueForEdit.status;
                }
                
                console.log("Converting queue to YAML:", queueForEdit);
                const content = yaml.dump(queueForEdit);
                console.log("Resulting YAML:", content);
                
                setEditorValue(content);
                setEditorError(null);
            } catch (error) {
                console.error("Error converting queue to YAML:", error);
                setEditorError("Failed to convert queue to YAML format: " + error.message);
            }
        }
    }, [open, queue]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setEditMode(newMode);
        }
    };

    const handleSave = () => {
        setLoading(true);
        setEditorError(null);
        
        try {
            console.log("Parsing YAML:", editorValue);
            const parsedYaml = yaml.load(editorValue);
            console.log("Parsed YAML result:", parsedYaml);
            
            // Validate the parsed YAML has the required structure
            if (!parsedYaml) {
                throw new Error("Failed to parse YAML or result is empty");
            }
            
            if (!parsedYaml.metadata || !parsedYaml.metadata.name) {
                throw new Error("Invalid queue structure. Queue must contain metadata.name field.");
            }
            
            if (!parsedYaml.spec) {
                throw new Error("Invalid queue structure. Queue must contain spec section.");
            }
            
            // Remove status field if present
            if (parsedYaml.status) {
                delete parsedYaml.status;
            }
            
            // Call the parent save handler with the parsed queue
            onSave(parsedYaml);
        } catch (error) {
            console.error("Error parsing edited YAML:", error);
            setEditorError("Error: " + error.message);
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
                Edit Queue {queue?.metadata?.name || ""}
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                    color="primary"
                    size="small"
                >
                    <ToggleButton value="yaml">YAML</ToggleButton>
                </ToggleButtonGroup>
            </DialogTitle>
            <DialogContent sx={{ height: "500px", p: 0 }}>
                {editorError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {editorError}
                    </Alert>
                )}
                <Editor
                    height="calc(100% - 10px)"
                    language="yaml"
                    value={editorValue}
                    onChange={(value) => {
                        setEditorValue(value || "");
                        // Clear error when user edits
                        if (editorError) setEditorError(null);
                    }}
                    options={{
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        wordWrap: "on",
                        lineNumbers: "on",
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
                <Button 
                    onClick={onClose} 
                    color="error" 
                    variant="outlined" 
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Updating..." : "Update Queue"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditQueueDialog;