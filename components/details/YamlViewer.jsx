import React from "react";
import Editor from "@monaco-editor/react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { getApiErrorMessage } from "../../lib/client/dashboard-api";

const YamlViewer = ({
    data,
    error,
    fill = false,
    isLoading,
    minHeight = 620,
}) => {
    const editorHeight = fill
        ? `max(${minHeight}px, calc(100vh - 158px))`
        : `${minHeight}px`;

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

    return (
        <Box
            sx={{
                height: fill ? editorHeight : "auto",
                minHeight,
                "& .monaco-editor, & .monaco-editor-background": {
                    bgcolor: "#f7f8fa",
                },
            }}
        >
            <Editor
                height={editorHeight}
                language="yaml"
                options={{
                    domReadOnly: true,
                    folding: true,
                    fontFamily:
                        '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: 12.5,
                    lineNumbersMinChars: 3,
                    minimap: { enabled: false },
                    overviewRulerBorder: false,
                    padding: { top: 12, bottom: 12 },
                    readOnly: true,
                    renderLineHighlight: "none",
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    wordWrap: "on",
                }}
                theme="vs"
                value={data || ""}
            />
        </Box>
    );
};

export default YamlViewer;
