import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";
import { borderColor, textMuted } from "./overviewStyles";
import { statusColors } from "./OverviewStatusChip";

const icons = {
    Degraded: <TimelineOutlinedIcon />,
    Healthy: <SpeedOutlinedIcon />,
    Overused: <LocalFireDepartmentOutlinedIcon />,
    Starving: <AccessTimeOutlinedIcon />,
};

const summaryTooltip =
    "Derived dashboard health summary from GET /api/v1/queues summary.schedulerMetrics. Queue resource/fairness metrics come from SchedulerMetricEndpoint; PodGroup running/pending/inqueue counts come from ControllersMetricEndpoint.";

const statusTooltips = {
    Degraded:
        "Queues classified as Busy or Underused. Busy means running PodGroups and pending/inqueue PodGroups exist together; Underused means requested resources exist but allocated CPU or memory is below 50% of requested.",
    Healthy:
        "Queues classified as Healthy or Idle. Healthy means running PodGroups exist without pending/inqueue backlog; Idle means no running, pending, or inqueue PodGroups.",
    Overused:
        "Queues where scheduler metrics report summary.schedulerMetrics.scheduling.overused=true, sourced from volcano_queue_overused.",
    Starving:
        "Queues with pending or inqueue PodGroups but no allocated CPU and no allocated memory.",
};

const SummaryCard = ({ item }) => {
    const colors = statusColors[item.label] || statusColors.Info;

    return (
        <Box
            sx={{
                alignItems: "center",
                borderBottom: `1px solid ${borderColor}`,
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: "42px 1fr",
                minHeight: 86,
                p: 1.5,
            }}
        >
            <Box
                sx={{
                    alignItems: "center",
                    color: colors.fg,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                {React.cloneElement(icons[item.label] || icons.Healthy, {
                    sx: { fontSize: 32 },
                })}
            </Box>
            <Box>
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.6 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                        {item.label} Queues
                    </Typography>
                    <Tooltip title={statusTooltips[item.label] || summaryTooltip}>
                        <InfoOutlinedIcon
                            aria-label={`${item.label} Queues source`}
                            sx={{ color: textMuted, fontSize: 14 }}
                        />
                    </Tooltip>
                </Box>
                <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
                    <Typography sx={{ fontSize: 26, fontWeight: 800 }}>
                        {item.value}
                    </Typography>
                    <Typography sx={{ color: textMuted, fontSize: 12 }}>
                        {item.percent}%
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

const QueueStatusSummary = ({ items }) => (
    <OverviewPanel sx={{ minHeight: 260 }}>
        <OverviewSectionHeader
            title={
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                    <span>Queue Status Summary</span>
                    <Tooltip title={summaryTooltip}>
                        <InfoOutlinedIcon
                            aria-label="Queue Status Summary source"
                            sx={{ color: textMuted, fontSize: 16 }}
                        />
                    </Tooltip>
                </Box>
            }
            subtitle="Derived queue health signals"
        />
        <Box
            sx={{
                display: "grid",
                gap: 0,
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            }}
        >
            {items.map((item) => (
                <SummaryCard key={item.label} item={item} />
            ))}
        </Box>
    </OverviewPanel>
);

export default QueueStatusSummary;
