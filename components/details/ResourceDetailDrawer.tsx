import React from "react";
import {
    Box,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const detailPanelBorder = "#dfe3e8";

const ResourceDetailDrawer = ({
    activeTab,
    icon,
    meta = [],
    onClose,
    onTabChange,
    open,
    renderTab,
    tabs,
    title,
    width = { xs: "calc(100vw - 56px)", sm: "calc(100vw - 220px)", lg: 1180 },
}) => {
    if (!open) {
        return null;
    }

    return (
        <>
            <Box
                aria-hidden="true"
                sx={{
                    bgcolor: "rgba(17, 24, 39, 0.26)",
                    bottom: 0,
                    left: 0,
                    pointerEvents: "none",
                    position: "fixed",
                    right: 0,
                    top: 0,
                    zIndex: 1290,
                }}
            />
            <Paper
                sx={{
                    bgcolor: "#ffffff",
                    border: `1px solid ${detailPanelBorder}`,
                    borderRight: 0,
                    borderRadius: 0,
                    bottom: 0,
                    boxShadow: "-18px 0 36px -22px rgba(15, 23, 42, 0.45)",
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: "100vw",
                    overflow: "hidden",
                    position: "fixed",
                    right: 0,
                    top: 0,
                    width,
                    zIndex: 1300,
                }}
            >
                <Box
                    sx={{
                        borderBottom: `1px solid ${detailPanelBorder}`,
                        px: { xs: 1.75, md: 2.25 },
                        py: 1.1,
                    }}
                >
                    <Box
                        sx={{
                            alignItems: "flex-start",
                            display: "flex",
                            gap: 2,
                            justifyContent: "space-between",
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 1.25,
                                    minWidth: 0,
                                }}
                            >
                                {icon}
                                <Typography
                                    sx={{
                                        color: "text.primary",
                                        fontSize: 15.5,
                                        fontWeight: 700,
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {title}
                                </Typography>
                            </Box>
                            {meta.length > 0 && (
                                <Stack
                                    direction="row"
                                    spacing={{ xs: 1.5, md: 2.75 }}
                                    sx={{
                                        flexWrap: "wrap",
                                        mt: 1.15,
                                        rowGap: 0.65,
                                    }}
                                >
                                    {meta.map((item) => (
                                        <Box
                                            key={item.label}
                                            sx={{
                                                alignItems: "center",
                                                display: "flex",
                                                gap: 0.6,
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    color: "text.secondary",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {item.label}:
                                            </Typography>
                                            {item.valueNode || (
                                                <Typography
                                                    sx={{
                                                        color: "text.primary",
                                                        fontSize: 12.5,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {item.value || "-"}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                <Tabs
                    onChange={(_, value) => onTabChange(value)}
                    sx={{
                        borderBottom: `1px solid ${detailPanelBorder}`,
                        minHeight: 44,
                        px: 1,
                        "& .MuiTab-root": {
                            fontSize: 13,
                            fontWeight: 500,
                            minHeight: 44,
                            px: 1.25,
                            textTransform: "none",
                        },
                    }}
                    value={activeTab}
                    variant="scrollable"
                >
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.value}
                            label={tab.label}
                            value={tab.value}
                        />
                    ))}
                </Tabs>

                <Box
                    sx={{
                        display: "flex",
                        flex: 1,
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "auto",
                        p: 2,
                    }}
                >
                    {renderTab(activeTab)}
                </Box>
            </Paper>
        </>
    );
};

export default ResourceDetailDrawer;
