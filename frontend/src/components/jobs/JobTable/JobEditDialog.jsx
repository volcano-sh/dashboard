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

const JobEditDialog = ({ open, job, onClose, onSave }) => {
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");

    const convertContent = (content, fromMode, toMode) => {
        try {
            if (fromMode === "yaml" && toMode === "json") {
                const parsed = yaml.load(content);
                return JSON.stringify(parsed, null, 2);
            } else if (fromMode === "json" && toMode === "yaml") {
                const parsed = JSON.parse(content);
                return yaml.dump(parsed);
            }
            return content;
        } catch (err) {
            console.error("Conversion error:", err);
            alert("Error converting content. Please check your input.");
            return content;
        }
    };

    useEffect(() => {
        if (open && job) {
            const initialContent =
                editMode === "yaml"
                    ? yaml.dump(job)
                    : JSON.stringify(job, null, 2);
            setEditorValue(initialContent);
        }
    }, [open, job, editMode]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            const converted = convertContent(editorValue, editMode, newMode);
            setEditMode(newMode);
            setEditorValue(converted);
        }
    };

    const handleSave = () => {
        try {
            const updatedJob =
                editMode === "yaml"
                    ? yaml.load(editorValue)
                    : JSON.parse(editorValue);

            onSave(updatedJob);
            onClose();
        } catch (err) {
            console.error("Parsing error:", err);
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
                Edit Job
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
                    onChange={(val) => setEditorValue(val || "")}
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

export default JobEditDialog;
