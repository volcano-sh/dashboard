import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    Typography,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const primaryColor = "#E34C26";

type CreateJobDialogProps = {
    onClose: () => void;
    onCreate: (resource: unknown) => void;
    open: boolean;
    resourceNameLabel?: string;
    resourceType?: string;
    title?: string;
};

const CreateJobDialog = ({
    open,
    onClose,
    onCreate,
    resourceType = "Job",
    title = "Create Job (YAML)",
}: CreateJobDialogProps) => {
    const [yamlText, setYamlText] = useState("");
    const [error, setError] = useState("");

    const handleYamlChange = (value) => {
        setYamlText(value || "");
        setError("");
    };

    const handleSubmit = () => {
        try {
            const parsed = yaml.load(yamlText);
            if (!parsed || typeof parsed !== "object") {
                setError("YAML must describe an object.");
                return;
            }
            setError("");
            onCreate(parsed);
            setYamlText("");
            onClose();
        } catch (e) {
            setError(e.message || "Invalid YAML format.");
        }
    };

    const handleClose = () => {
        setYamlText("");
        setError("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                style: {
                    borderRadius: "14px",
                    boxShadow: "0 10px 32px rgba(227,76,38,0.16)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    color: primaryColor,
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    pb: 1,
                    letterSpacing: "0.5px",
                }}
            >
                {title}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography sx={{ fontWeight: 500, color: "#333", mb: 1 }}>
                        Paste or type your {resourceType} YAML specification
                        below:
                    </Typography>
                    <Editor
                        height="320px"
                        defaultLanguage="yaml"
                        value={yamlText}
                        theme="vs-dark"
                        onChange={handleYamlChange}
                        options={{
                            fontSize: 15,
                            minimap: { enabled: false },
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                        }}
                    />
                    {error && (
                        <Typography
                            sx={{
                                color: "#d32f2f",
                                fontSize: "0.98rem",
                                mt: 1.2,
                                mb: -1,
                                fontWeight: 500,
                            }}
                        >
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        color: primaryColor,
                        borderColor: primaryColor,
                        fontWeight: 600,
                        borderRadius: "7px",
                        minWidth: 110,
                        "&:hover": {
                            borderColor: primaryColor,
                            bgcolor: "rgba(227,76,38,0.04)",
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        bgcolor: primaryColor,
                        color: "#fff",
                        fontWeight: 600,
                        borderRadius: "7px",
                        minWidth: 110,
                        boxShadow: "0 3px 10px 0 rgba(227,76,38,0.14)",
                        "&:hover": {
                            bgcolor: "#cb3f1c",
                        },
                    }}
                    disabled={!yamlText.trim()}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateJobDialog;
