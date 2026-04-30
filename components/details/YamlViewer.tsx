import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import * as yaml from "js-yaml";
import { getApiErrorMessage } from "../../lib/client/dashboard-api";

type YamlViewerProps = {
    data?: string;
    editable?: boolean;
    error?: unknown;
    fill?: boolean;
    isLoading?: boolean;
    minHeight?: number;
    onSubmit?: (manifest: unknown) => Promise<void> | void;
};

const YamlViewer = ({
    data,
    editable = false,
    error,
    fill = false,
    isLoading,
    minHeight = 620,
    onSubmit,
}: YamlViewerProps) => {
    const [editorValue, setEditorValue] = useState(data || "");
    const [isEditing, setIsEditing] = useState(false);
    const [parseError, setParseError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const editorHeight = fill
        ? `max(${minHeight}px, calc(100vh - 158px))`
        : `${minHeight}px`;

    useEffect(() => {
        if (!isEditing) {
            setEditorValue(data || "");
        }
    }, [data, isEditing]);

    const handleCancel = () => {
        setEditorValue(data || "");
        setParseError("");
        setIsEditing(false);
    };

    const handleSubmit = async () => {
        setParseError("");
        let parsed: unknown;
        try {
            parsed = yaml.load(editorValue);
        } catch (yamlError) {
            setParseError(
                yamlError instanceof Error
                    ? yamlError.message
                    : "Invalid YAML",
            );
            return;
        }

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {
            setParseError("YAML must contain a single Kubernetes object.");
            return;
        }

        try {
            setIsSaving(true);
            await onSubmit?.(parsed);
            setIsEditing(false);
        } catch (submitError) {
            setParseError(
                getApiErrorMessage(submitError, "Failed to submit YAML"),
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    minHeight: fill ? editorHeight : minHeight,
                }}
            >
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ boxShadow: "none" }}>
                {getApiErrorMessage(error, "Failed to fetch YAML")}
            </Alert>
        );
    }

    const showActions = editable && !error && !isLoading;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: fill ? editorHeight : "auto",
                minHeight,
                "& .monaco-editor, & .monaco-editor-background": {
                    bgcolor: "#f7f8fa",
                },
            }}
        >
            {showActions && (
                <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{
                        borderBottom: "1px solid #dfe3e8",
                        mb: 1,
                        pb: 1,
                    }}
                >
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                        {isEditing
                            ? "Edit the Kubernetes manifest and submit it directly."
                            : "View the live Kubernetes manifest."}
                    </Typography>
                    {isEditing ? (
                        <Stack direction="row" spacing={1}>
                            <Button
                                disabled={isSaving}
                                onClick={handleCancel}
                                size="small"
                                sx={{ textTransform: "none" }}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isSaving}
                                onClick={handleSubmit}
                                size="small"
                                startIcon={<SaveOutlinedIcon fontSize="small" />}
                                sx={{ textTransform: "none" }}
                                variant="contained"
                            >
                                {isSaving ? "Submitting..." : "Submit"}
                            </Button>
                        </Stack>
                    ) : (
                        <Button
                            onClick={() => setIsEditing(true)}
                            size="small"
                            startIcon={<EditOutlinedIcon fontSize="small" />}
                            sx={{ textTransform: "none" }}
                            variant="outlined"
                        >
                            Edit
                        </Button>
                    )}
                </Stack>
            )}
            {parseError && (
                <Alert severity="error" sx={{ mb: 1, boxShadow: "none" }}>
                    {parseError}
                </Alert>
            )}
            <Editor
                height={
                    showActions
                        ? `calc(${editorHeight} - ${parseError ? 98 : 52}px)`
                        : editorHeight
                }
                language="yaml"
                onChange={(value) => setEditorValue(value || "")}
                options={{
                    domReadOnly: !isEditing,
                    folding: true,
                    fontFamily:
                        '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: 12.5,
                    lineNumbersMinChars: 3,
                    minimap: { enabled: false },
                    overviewRulerBorder: false,
                    padding: { top: 12, bottom: 12 },
                    readOnly: !isEditing,
                    renderLineHighlight: "none",
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    wordWrap: "on",
                }}
                theme="vs"
                value={editorValue}
            />
        </Box>
    );
};

export default YamlViewer;
