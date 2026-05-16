import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const [editorValue, setEditorValue] = useState("");
    const [editMode, setEditMode] = useState("yaml");

    useEffect(() => {
        if (open && job) {
            const initialContent = yaml.dump(job); // Always keep YAML content
            setEditorValue(initialContent);
        }
    }, [open, job]);

    const handleModeChange = (event, newMode) => {
        if (newMode !== null) {
            setEditMode(newMode); // Only change syntax highlighting
        }
    };

    const handleSave = () => {
        try {
            const updatedJob = yaml.load(editorValue); // Always parse as YAML
            onSave(updatedJob);
            onClose();
        } catch (err) {
            console.error("Parsing error:", err);
            alert(t("invalid_yaml_alert"));
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
                {t("edit_job")}
                <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={handleModeChange}
                    color="primary"
                >
                    <ToggleButton value="yaml">{t("yaml")}</ToggleButton>
                </ToggleButtonGroup>
            </DialogTitle>
            <DialogContent sx={{ height: "500px" }}>
                <Editor
                    height="100%"
                    language={editMode} // Just controls syntax highlight
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
                    {t("cancel")}
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                >
                    {t("update")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JobEditDialog;
