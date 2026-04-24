import React from "react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Switch,
    Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

const settingSections = [
    {
        title: "Cluster Access",
        icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 20 }} />,
        rows: [
            ["Current Role", "Cluster administrator"],
            ["Namespace Scope", "All namespaces"],
            ["Session Timeout", "30 minutes"],
        ],
    },
    {
        title: "Dashboard Preferences",
        icon: <TuneOutlinedIcon sx={{ fontSize: 20 }} />,
        rows: [
            ["Default Landing Page", "Overview"],
            ["Queue View", "Tree"],
            ["Refresh Interval", "Last 15m"],
        ],
    },
    {
        title: "Data Source",
        icon: <StorageOutlinedIcon sx={{ fontSize: 20 }} />,
        rows: [
            ["Kubernetes API", "Connected"],
            ["Scheduler Metrics", "Connected"],
            ["Configuration Mode", "Read-only preview"],
        ],
    },
];

const Settings = () => {
    return (
        <Box
            sx={{ bgcolor: "#f7f8fa", minHeight: "calc(100vh - 64px)", p: 0.5 }}
        >
            <Card sx={{ border: "1px solid #dfe3e8", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        component="h1"
                        sx={{ fontSize: 22, fontWeight: 700 }}
                    >
                        Settings
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ fontSize: 13, mt: 0.5 }}
                    >
                        Manage dashboard preferences and login-session defaults.
                    </Typography>
                    <Divider sx={{ my: 2.5 }} />
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                                xs: "1fr",
                                lg: "repeat(3, 1fr)",
                            },
                        }}
                    >
                        {settingSections.map((section) => (
                            <Box
                                key={section.title}
                                sx={{
                                    border: "1px solid #e1e4e8",
                                    borderRadius: 1,
                                    p: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        alignItems: "center",
                                        display: "flex",
                                        gap: 1,
                                        mb: 1.5,
                                    }}
                                >
                                    {section.icon}
                                    <Typography
                                        sx={{ fontSize: 16, fontWeight: 700 }}
                                    >
                                        {section.title}
                                    </Typography>
                                </Box>
                                {section.rows.map(([label, value]) => (
                                    <Box
                                        key={label}
                                        sx={{
                                            alignItems: "center",
                                            borderTop: "1px solid #eef0f2",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            py: 1,
                                        }}
                                    >
                                        <Typography
                                            color="text.secondary"
                                            sx={{ fontSize: 13 }}
                                        >
                                            {label}
                                        </Typography>
                                        <Typography sx={{ fontSize: 13 }}>
                                            {value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                    <Box
                        sx={{
                            border: "1px solid #e1e4e8",
                            borderRadius: 1,
                            mt: 2,
                            p: 2,
                        }}
                    >
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 1,
                            }}
                        >
                            <NotificationsNoneOutlinedIcon
                                sx={{ fontSize: 20 }}
                            />
                            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                                Notifications
                            </Typography>
                            <Chip label="Preview" size="small" sx={{ ml: 1 }} />
                        </Box>
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 1.5,
                            }}
                        >
                            <Typography sx={{ fontSize: 13 }}>
                                Show queue health and scheduler policy warnings
                            </Typography>
                            <Switch defaultChecked size="small" />
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Settings;
