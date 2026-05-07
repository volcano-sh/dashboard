import React, { useState, useContext } from "react";
import { Box, Tab, Tabs, Typography, Paper } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import TerminalIcon from "@mui/icons-material/Terminal";
import TitleComponent from "../Titlecomponent";
import translations from "./translations";
import { LanguageContext } from "../../contexts/LanguageContext";

/**
 * Scheduler management section — initial skeleton for LFX Mentorship #197.
 * Provides the foundational layout for Configuration, Metrics, and Logs tabs.
 *
 * Translation-ready: uses a centralized translations object that can be
 * integrated with the project's i18n system once established.
 */
const Scheduler = () => {
    const [tabValue, setTabValue] = useState(0);
    const { lang } = useContext(LanguageContext);
    const t = translations[lang].scheduler;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const tabConfig = [
        {
            id: "config",
            label: t.config,
            icon: <SettingsIcon sx={{ fontSize: 20 }} />,
            description: t.configDesc,
        },
        {
            id: "metrics",
            label: t.metrics,
            icon: <BarChartIcon sx={{ fontSize: 20 }} />,
            description: t.metricsDesc,
        },
        {
            id: "logs",
            label: t.logs,
            icon: <TerminalIcon sx={{ fontSize: 20 }} />,
            description: t.logsDesc,
        },
    ];

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            <TitleComponent text={t.title} />
            <Box sx={{ mt: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                    }}
                >
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="secondary"
                        textColor="inherit"
                        sx={{
                            bgcolor: "rgba(0, 0, 0, 0.02)",
                            borderBottom: 1,
                            borderColor: "divider",
                            "& .MuiTabs-indicator": {
                                backgroundColor: "primary.main",
                            },
                            "& .MuiTab-root": {
                                py: 1.5,
                                minHeight: 48,
                                textTransform: "none",
                                "&.Mui-selected": {
                                    color: "primary.main",
                                    fontWeight: 600,
                                },
                            },
                        }}
                    >
                        {tabConfig.map((tab) => (
                            <Tab
                                key={tab.id}
                                icon={tab.icon}
                                iconPosition="start"
                                label={tab.label}
                            />
                        ))}
                    </Tabs>

                    <Box sx={{ p: 4 }}>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 500, mb: 1 }}
                        >
                            {tabConfig[tabValue].label}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 3, maxWidth: 600 }}
                        >
                            {tabConfig[tabValue].description}
                        </Typography>

                        <Box
                            sx={{
                                height: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px dashed",
                                borderColor: "divider",
                                borderRadius: 2,
                                bgcolor: "#fafafa",
                                color: "text.disabled",
                                fontSize: "0.875rem",
                            }}
                        >
                            {t.placeholder}
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default Scheduler;
