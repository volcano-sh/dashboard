import React, { useEffect } from "react";
import { Box, ToggleButton, ToggleButtonGroup, useTheme, alpha } from "@mui/material";
import { AccountTree, ViewList } from "@mui/icons-material";

const QueueTreeToggle = ({ viewMode, onViewModeChange }) => {
    const theme = useTheme();

    // Load saved view mode preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem("queueViewMode");
        if (savedViewMode && (savedViewMode === "tree" || savedViewMode === "table")) {
            onViewModeChange(null, savedViewMode);
        }
    }, [onViewModeChange]);

    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            // Save preference to localStorage
            localStorage.setItem("queueViewMode", newViewMode);
            onViewModeChange(event, newViewMode);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                mb: 3,
            }}
        >
            <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    "& .MuiToggleButton-root": {
                        border: "none",
                        padding: "10px 24px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        letterSpacing: "0.01em",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                        "&.Mui-selected": {
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.common.white,
                            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.15)",
                            "&:hover": {
                                bgcolor: theme.palette.primary.dark,
                            },
                        },
                    },
                }}
            >
                <ToggleButton value="tree" aria-label="tree view">
                    <AccountTree sx={{ mr: 1, fontSize: "1.2rem" }} />
                    Tree View
                </ToggleButton>
                <ToggleButton value="table" aria-label="table view">
                    <ViewList sx={{ mr: 1, fontSize: "1.2rem" }} />
                    Table View
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );
};

export default QueueTreeToggle;
