import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { OverviewPanel } from "./OverviewPanel";
import { textMuted } from "./overviewStyles";

const metricIcons = {
    activeQueues: <LayersOutlinedIcon />,
    avgLatency: <AccessTimeOutlinedIcon />,
    pendingJobs: <HourglassEmptyOutlinedIcon />,
    runningJobs: <PlayCircleOutlineOutlinedIcon />,
    runningPods: <Inventory2OutlinedIcon />,
    totalJobs: <WorkOutlineOutlinedIcon />,
};

const OverviewMetricCard = ({ detail, iconKey, title, tooltip, trend, value }) => (
    <OverviewPanel>
        <Box sx={{ alignItems: "center", display: "flex", gap: 2 }}>
            <Box
                sx={{
                    alignItems: "center",
                    color: "#344054",
                    display: "flex",
                    fontSize: 32,
                }}
            >
                {React.cloneElement(metricIcons[iconKey], { sx: { fontSize: 32 } })}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {title}
                    </Typography>
                    {tooltip && (
                        <Tooltip title={tooltip}>
                            <InfoOutlinedIcon
                                aria-label={`${title} source`}
                                sx={{ color: textMuted, fontSize: 15 }}
                            />
                        </Tooltip>
                    )}
                </Box>
                <Typography
                    sx={{
                        fontSize: 28,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.15,
                        mt: 0.5,
                    }}
                >
                    {value}
                </Typography>
                <Typography sx={{ color: textMuted, fontSize: 12, mt: 0.75 }}>
                    {trend || detail}
                </Typography>
            </Box>
        </Box>
    </OverviewPanel>
);

const OverviewMetricGrid = ({ metrics }) => (
    <Box
        sx={{
            display: "grid",
            gap: 1.75,
            gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(6, 1fr)",
            },
            mb: 2,
        }}
    >
        {metrics.map((metric) => (
            <OverviewMetricCard key={metric.title} {...metric} />
        ))}
    </Box>
);

export default OverviewMetricGrid;
