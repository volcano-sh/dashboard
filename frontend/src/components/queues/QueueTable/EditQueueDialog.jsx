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

            // Parse the editor content
            let parsedContent;
            try {
                parsedContent =
                    editMode === "yaml"
                        ? yaml.load(editorValue)
                        : JSON.parse(editorValue);
            } catch (parseError) {
                throw new Error(
                    `Invalid ${editMode.toUpperCase()} format: ${parseError.message}`,
                );
            }

            // Validate the parsed content using our validation function
            validateQueueConfig(parsedContent);

            const queueName = parsedContent.metadata?.name;

            // Prepare the patch data
            const patchData = {
                spec: {
                    ...parsedContent.spec,
                },
            };

            // Send the patch request
            const response = await fetch(`/api/queues/${queueName}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(patchData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.details ||
                        errorData.error ||
                        "Failed to update queue",
                );
            }

            const result = await response.json();

            // Get the updated queue data to pass to the onSave callback
            try {
                // Fetch the updated queue data
                const updatedQueueResponse = await fetch(
                    `/api/queues/${queueName}`,
                );
                if (updatedQueueResponse.ok) {
                    const updatedQueue = await updatedQueueResponse.json();
                    // Call onSave with the updated queue data
                    onSave(updatedQueue);
                } else {
                    // If we can't get the updated queue, at least pass the result data
                    onSave(result.data);
                }
            } catch (fetchError) {
                console.error("Error fetching updated queue:", fetchError);
                // Still call onSave with whatever data we have
                onSave(result.data);
            }

            onClose();
        } catch (error) {
            console.error("Update failed:", error);
            // Use a more user-friendly error message
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Add a validation function
    const validateQueueConfig = (config) => {
        if (!config || typeof config !== "object") {
            throw new Error("Invalid configuration format");
        }

        if (!config.metadata?.name) {
            throw new Error("Queue name is missing");
        }

        if (!config.spec || typeof config.spec !== "object") {
            throw new Error("Queue spec is missing or invalid");
        }

        // Add any additional validation rules here

        return true;
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
