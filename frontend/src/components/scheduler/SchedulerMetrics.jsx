import React from "react";
import { Alert, Box, Typography } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";

/**
 * Placeholder for the Metrics tab.
 * Full Prometheus metric parsing and chart rendering will be implemented
 * in a follow-up PR that adds GET /api/scheduler/metrics on the backend.
 */
const SchedulerMetrics = () => (
    <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            gap: 2,
        }}
    >
        <BarChartIcon sx={{ fontSize: 64, color: "text.disabled" }} />
        <Typography variant="h6" color="text.secondary">
            Metrics coming soon
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 480 }}>
            The Metrics tab will surface scheduler Prometheus data (scheduling
            latency, preemption counts, unschedulable job/task counts) once the{" "}
            <code>GET /api/scheduler/metrics</code> endpoint is merged.
        </Alert>
    </Box>
);

export default SchedulerMetrics;
