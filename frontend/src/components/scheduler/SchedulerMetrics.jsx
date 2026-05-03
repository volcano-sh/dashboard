import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Tooltip,
    Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Bar, Line } from "react-chartjs-2";
import "../Charts/chartConfig";

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color = "text.primary", tooltip }) => (
    <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
            <Tooltip title={tooltip || ""} placement="top">
                <Typography variant="caption" color="text.secondary" noWrap>
                    {label}
                </Typography>
            </Tooltip>
            <Typography variant="h4" fontWeight={700} color={color} sx={{ mt: 0.5 }}>
                {value === null || value === undefined ? "—" : value}
            </Typography>
        </CardContent>
    </Card>
);

// ── Chart helpers ──────────────────────────────────────────────────────────────

const makeLineDataset = (series, labelKey = "action") => ({
    labels: series.map((p) => p.labels?.[labelKey] || "unknown"),
    datasets: [
        {
            label: "Latency (ms)",
            data: series.map((p) => p.value),
            borderColor: "#2196f3",
            backgroundColor: "rgba(33,150,243,0.15)",
            tension: 0.3,
            fill: true,
            pointRadius: 4,
        },
    ],
});

const makeBarDataset = (series, labelKey = "action") => ({
    labels: series.map((p) => p.labels?.[labelKey] || "unknown"),
    datasets: [
        {
            label: "Latency (ms)",
            data: series.map((p) => p.value),
            backgroundColor: "#4caf50",
            borderColor: "#388e3c",
            borderWidth: 1,
        },
    ],
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
};

// ── Component ──────────────────────────────────────────────────────────────────

const SchedulerMetrics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/scheduler/metrics");
            setData(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Failed to fetch metrics: " + err.message,
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const m = data?.metrics;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                    {data && (
                        <Typography variant="caption" color="text.secondary">
                            Pod: <strong>{data.pod}</strong> &nbsp;·&nbsp; Last updated:{" "}
                            {lastUpdated?.toLocaleTimeString()}
                        </Typography>
                    )}
                </Box>
                <Button
                    size="small"
                    startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
                    onClick={fetchMetrics}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={fetchMetrics}>Retry</Button>
                } sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading && !data && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {m && (
                <>
                    {/* ── Stat cards ── */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {[
                            {
                                label: "Unschedulable Jobs",
                                value: m.statCards.unschedulableJobs,
                                color: m.statCards.unschedulableJobs > 0 ? "error.main" : "success.main",
                                tooltip: "volcano_queue_unschedulable_task_count",
                            },
                            {
                                label: "Unschedulable Tasks",
                                value: m.statCards.unschedulableTasks,
                                color: m.statCards.unschedulableTasks > 0 ? "warning.main" : "success.main",
                                tooltip: "volcano_task_unschedulable_count",
                            },
                            {
                                label: "Preemption Victims",
                                value: m.statCards.preemptionVictims,
                                tooltip: "volcano_preemption_victims",
                            },
                            {
                                label: "Preemption Attempts",
                                value: m.statCards.preemptionAttempts,
                                tooltip: "volcano_preemption_attempts_total",
                            },
                        ].map((card) => (
                            <Grid item xs={6} md={3} key={card.label}>
                                <StatCard {...card} />
                            </Grid>
                        ))}
                    </Grid>

                    {/* ── E2E latency line chart ── */}
                    {m.charts.e2eLatency.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                E2E Scheduling Latency (ms)
                            </Typography>
                            <Box sx={{ height: 220 }}>
                                <Line
                                    data={makeLineDataset(m.charts.e2eLatency, "quantile")}
                                    options={chartOptions}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* ── Per-action latency bar chart ── */}
                    {m.charts.actionLatency.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                Per-Action Scheduling Latency (ms)
                            </Typography>
                            <Box sx={{ height: 220 }}>
                                <Bar
                                    data={makeBarDataset(m.charts.actionLatency, "action")}
                                    options={chartOptions}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* ── Per-plugin latency bar chart ── */}
                    {m.charts.pluginLatency.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                Per-Plugin Scheduling Latency (ms)
                            </Typography>
                            <Box sx={{ height: 220 }}>
                                <Bar
                                    data={makeBarDataset(m.charts.pluginLatency, "plugin")}
                                    options={chartOptions}
                                />
                            </Box>
                        </Box>
                    )}

                    {m.charts.e2eLatency.length === 0 &&
                        m.charts.actionLatency.length === 0 && (
                            <Alert severity="info">
                                No latency series found in the metrics response. Scheduling latency
                                metrics are emitted after the scheduler processes at least one cycle.
                            </Alert>
                        )}
                </>
            )}
        </Box>
    );
};

export default SchedulerMetrics;
