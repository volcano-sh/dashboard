import React from "react";
import { Box, Typography, Button, useTheme, alpha } from "@mui/material";

const EmptyState = ({
    resourceType = "Resource",
    hasFilters = false,
    onClearFilters = () => {},
    onRefresh = () => {},
    customMessages = {},
    customButtons = {},
}) => {
    const theme = useTheme();

    const defaultMessages = {
        noDataTitle: `No ${resourceType}s Available`,
        noDataDescription: `There are currently no ${resourceType.toLowerCase()}s deployed in the cluster.`,
        noMatchTitle: `No Matching ${resourceType}s Found`,
        noMatchDescription: `No ${resourceType.toLowerCase()}s match your current filter criteria. Try adjusting your filters to see more results.`,
    };

    const messages = { ...defaultMessages, ...customMessages };

    const defaultButtons = {
        clearFiltersText: "Clear Filters",
        refreshText: "Refresh",
    };

    const buttonTexts = { ...defaultButtons, ...customButtons };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                minHeight: "300px",
                textAlign: "center",
            }}
        >
            <Box
                sx={{
                    mb: 3,
                    height: "120px",
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.8,
                }}
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M60 10L105 35V85L60 110L15 85V35L60 10Z"
                        fill={theme.palette.primary.main}
                    />
                    <path
                        d="M60 40L80 50V70L60 80L40 70V50L60 40Z"
                        fill={theme.palette.background.paper}
                    />
                    <path
                        d="M60 40V60L80 50M60 60V80M60 60L40 50"
                        stroke={alpha(theme.palette.primary.main, 0.3)}
                        strokeWidth="1"
                    />
                    <text
                        x="60"
                        y="95"
                        fontSize="14"
                        fontWeight="500"
                        fill={theme.palette.primary.contrastText}
                        textAnchor="middle"
                        style={{ textTransform: "lowercase" }}
                    >
                        {resourceType.toLowerCase()}
                    </text>
                </svg>
            </Box>

            <Typography variant="h5" sx={{ mb: 1, fontWeight: "medium" }}>
                {hasFilters ? messages.noMatchTitle : messages.noDataTitle}
            </Typography>

            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: "400px", mb: 3 }}
            >
                {hasFilters
                    ? messages.noMatchDescription
                    : messages.noDataDescription}
            </Typography>

            {hasFilters ? (
                <Button
                    variant="outlined"
                    onClick={onClearFilters}
                    sx={{ mr: 2 }}
                >
                    {buttonTexts.clearFiltersText}
                </Button>
            ) : (
                <Button
                    variant="contained"
                    onClick={onRefresh}
                    startIcon={
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M20 12c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8c2.75 0 5.17-1.39 6.61-3.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M20 5v7h-7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    }
                >
                    {buttonTexts.refreshText}
                </Button>
            )}
        </Box>
    );
};

export default EmptyState;
