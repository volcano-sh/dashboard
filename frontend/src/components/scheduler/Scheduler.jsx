import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ArticleIcon from "@mui/icons-material/Article";
import SchedulerConfig from "./SchedulerConfig";
import SchedulerMetrics from "./SchedulerMetrics";
import SchedulerLogs from "./SchedulerLogs";

const TabPanel = ({ children, value, index }) => (
    <Box
        role="tabpanel"
        hidden={value !== index}
        id={`scheduler-tabpanel-${index}`}
        aria-labelledby={`scheduler-tab-${index}`}
        sx={{ pt: 3 }}
    >
        {value === index && children}
    </Box>
);

const TABS = [
    { label: "Config", icon: <SettingsIcon fontSize="small" /> },
    { label: "Metrics", icon: <ShowChartIcon fontSize="small" /> },
    { label: "Logs", icon: <ArticleIcon fontSize="small" /> },
];

const Scheduler = () => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box sx={{ p: 0 }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                Scheduler
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    aria-label="Scheduler section tabs"
                >
                    {TABS.map((tab, i) => (
                        <Tab
                            key={tab.label}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            id={`scheduler-tab-${i}`}
                            aria-controls={`scheduler-tabpanel-${i}`}
                        />
                    ))}
                </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
                <SchedulerConfig />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
                <SchedulerMetrics />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
                <SchedulerLogs />
            </TabPanel>
        </Box>
    );
};

export default Scheduler;
