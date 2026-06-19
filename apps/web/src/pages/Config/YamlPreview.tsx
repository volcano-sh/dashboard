import React, { useState } from "react";
import { Segmented, Badge } from "antd";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { Box, Typography, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

interface YamlPreviewProps {
    currentYaml: string;
    savedYaml: string;
    hasChanges: boolean;
}

export const YamlPreview: React.FC<YamlPreviewProps> = ({
    currentYaml,
    savedYaml,
    hasChanges,
}) => {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<string>("preview");

    const segmentedOptions = [
        { label: t("raw_yaml_preview", "Raw YAML Preview"), value: "preview" },
        { label: t("diff_vs_saved", "Diff vs Saved"), value: "diff" },
    ];

    return (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={1}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, m: 0 }}>
                        {t("yaml_preview", "YAML Preview & Diff")}
                    </Typography>
                    {hasChanges && (
                        <Badge
                            status="warning"
                            text={t("unsaved_changes", "Unsaved Changes")}
                        />
                    )}
                </Box>
                <Segmented
                    options={segmentedOptions}
                    value={viewMode}
                    onChange={(val) => setViewMode(String(val))}
                />
            </Box>

            {viewMode === "preview" ? (
                <Box
                    sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        maxHeight: "500px",
                        overflow: "auto",
                    }}
                >
                    <pre
                        style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: "13px",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {currentYaml}
                    </pre>
                </Box>
            ) : (
                <Box
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        fontSize: "12px",
                    }}
                >
                    <ReactDiffViewer
                        oldValue={savedYaml}
                        newValue={currentYaml}
                        splitView={true}
                        compareMethod={DiffMethod.WORDS}
                        leftTitle={t("saved_config", "Saved Config")}
                        rightTitle={t("modified_config", "Modified Config")}
                        styles={{
                            variables: {
                                light: {
                                    diffViewerBackground: "#ffffff",
                                },
                            },
                        }}
                    />
                </Box>
            )}
        </Paper>
    );
};
export default YamlPreview;
