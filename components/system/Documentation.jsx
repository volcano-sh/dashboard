import React from "react";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import { BookOpen, Code, ExternalLink, FileText } from "lucide-react";

const documentCards = [
    {
        title: "Dashboard Guide",
        description:
            "Understand the overview, queue health panels, and scheduler checks.",
        icon: <BookOpen size={20} strokeWidth={1.8} />,
    },
    {
        title: "Configuration Reference",
        description:
            "Review queue, policy, plugin, and preemption configuration fields.",
        icon: <FileText size={20} strokeWidth={1.8} />,
    },
    {
        title: "API Integration",
        description:
            "Map the static wireframe data to backend and Kubernetes API endpoints.",
        icon: <Code size={20} strokeWidth={1.8} />,
    },
];

const Documentation = () => {
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
                        Documentation
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ fontSize: 13, mt: 0.5 }}
                    >
                        Quick links for operating and extending Volcano
                        Dashboard.
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
                        {documentCards.map((card) => (
                            <Box
                                key={card.title}
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
                                        mb: 1,
                                    }}
                                >
                                    {card.icon}
                                    <Typography
                                        sx={{ fontSize: 16, fontWeight: 700 }}
                                    >
                                        {card.title}
                                    </Typography>
                                </Box>
                                <Typography
                                    color="text.secondary"
                                    sx={{ fontSize: 13 }}
                                >
                                    {card.description}
                                </Typography>
                                <Box
                                    sx={{
                                        alignItems: "center",
                                        color: "primary.main",
                                        display: "flex",
                                        gap: 0.75,
                                        mt: 2,
                                    }}
                                >
                                    <Typography sx={{ fontSize: 13 }}>
                                        Open documentation
                                    </Typography>
                                    <ExternalLink size={15} strokeWidth={1.8} />
                                </Box>
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
                        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                            Current Implementation Notes
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13, mt: 1 }}
                        >
                            Configuration, Settings, and Documentation currently
                            render wireframe-aligned static content. Live
                            backend integration can replace these local data
                            blocks later without changing routes.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Documentation;
