import { Box, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";
import { borderColor, textMuted } from "./overviewStyles";
import { formatLatency } from "./overviewUtils";

const sectionTooltip =
    "Values are from the current SchedulerMetricEndpoint scrape. Histogram averages are cumulative since scheduler process start. Counters are cumulative; gauges are current values.";

const SectionTitle = ({ children }) => (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{children}</Typography>
        <Tooltip title={sectionTooltip}>
            <InfoOutlinedIcon
                aria-label={`${children} source`}
                sx={{ color: textMuted, fontSize: 15 }}
            />
        </Tooltip>
    </Box>
);

const BarRows = ({ rows, valueLabel = formatLatency }) => {
    const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1);
    if (!rows.length) {
        return (
            <Typography sx={{ color: textMuted, fontSize: 12 }}>
                No scheduler metric samples.
            </Typography>
        );
    }

    return (
        <Box sx={{ display: "grid", gap: 1.25 }}>
            {rows.map((row) => (
                <Box key={row.label}>
                    <Box
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                        }}
                    >
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                            {row.label}
                        </Typography>
                        <Typography sx={{ color: textMuted, fontSize: 12 }}>
                            {valueLabel(row.value)}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            bgcolor: "#e5e7eb",
                            borderRadius: 999,
                            height: 7,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: row.color || "#1f5fae",
                                borderRadius: 999,
                                height: "100%",
                                width: `${Math.max(
                                    2,
                                    Math.min((Number(row.value || 0) / max) * 100, 100),
                                )}%`,
                            }}
                        />
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

const StatPair = ({ framed = true, items }) => (
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, 1fr)" }}>
        {items.map((item) => (
            <Box
                key={item.label}
                sx={{
                    border: framed ? `1px solid ${borderColor}` : 0,
                    borderRadius: 1,
                    minHeight: framed ? 132 : "auto",
                    p: framed ? 1.6 : 0,
                }}
            >
                <Typography sx={{ color: textMuted, fontSize: 12, mb: 1.6 }}>
                    {item.label}
                </Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 800, mt: 0.5 }}>
                    {item.value}
                </Typography>
            </Box>
        ))}
    </Box>
);

const SchedulerMetricsSnapshot = ({ metrics }) => {
    const scheduling = metrics || {};
    const latency = scheduling.latency || {};
    const unschedulable = scheduling.unschedulable || {};
    const preemption = scheduling.preemption || {};
    const latencyRows = [
        {
            color: "#1f5fae",
            count: scheduling.samples,
            label: "E2E Scheduling",
            value: latency.e2eAvgMs,
        },
        {
            color: "#16a34a",
            label: "Job Scheduling",
            value: latency.jobAvgMs,
        },
        {
            color: "#f59e0b",
            label: "Task Scheduling",
            value: latency.taskAvgMs,
        },
    ].filter((row) => row.value !== null && row.value !== undefined);
    const actionRows = (scheduling.actionLatency || []).map((item) => ({
        count: item.count,
        label: item.action,
        value: item.avgMs,
    }));
    const pluginRows = (scheduling.pluginLatency || []).map((item) => ({
        count: item.count,
        label: `${item.plugin} / ${item.onSession}`,
        value: item.avgMs,
    }));
    const preemptionSuccessRate = preemption.attempts
        ? `${Math.round((Number(preemption.victims || 0) / preemption.attempts) * 100)}%`
        : "0%";

    return (
        <OverviewPanel>
            <OverviewSectionHeader title="Scheduler Metrics" />
            <Box
                sx={{
                    display: "grid",
                    gap: 0,
                    gridTemplateColumns: {
                        xs: "1fr",
                        lg: "1fr 1fr 1.1fr 1.15fr",
                    },
                }}
            >
                <Box
                    sx={{
                        borderRight: { lg: `1px solid ${borderColor}` },
                        display: "grid",
                        gap: 2.4,
                        pr: { lg: 3 },
                    }}
                >
                    <SectionTitle>Latency Breakdown</SectionTitle>
                    <BarRows rows={latencyRows} />
                </Box>
                <Box
                    sx={{
                        borderRight: { lg: `1px solid ${borderColor}` },
                        display: "grid",
                        gap: 2.4,
                        px: { lg: 3 },
                    }}
                >
                    <SectionTitle>Action Latency</SectionTitle>
                    <BarRows rows={actionRows} />
                </Box>
                <Box
                    sx={{
                        borderRight: { lg: `1px solid ${borderColor}` },
                        display: "grid",
                        gap: 2.4,
                        px: { lg: 3 },
                    }}
                >
                    <SectionTitle>Plugin Latency (Top 5)</SectionTitle>
                    <BarRows rows={pluginRows} />
                </Box>
                <Box sx={{ display: "grid", gap: 2.4, pl: { lg: 3 } }}>
                    <SectionTitle>Unschedulable & Preemption</SectionTitle>
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                border: `1px solid ${borderColor}`,
                                borderRadius: 1,
                                p: 1.6,
                            }}
                        >
                            <SectionTitle>Unschedulable</SectionTitle>
                            <StatPair
                                framed={false}
                                items={[
                                    {
                                        label: "Jobs",
                                        value: unschedulable.jobs ?? 0,
                                    },
                                    {
                                        label: "Tasks",
                                        value: unschedulable.tasks ?? 0,
                                    },
                                ]}
                            />
                        </Box>
                        <Box
                            sx={{
                                border: `1px solid ${borderColor}`,
                                borderRadius: 1,
                                p: 1.6,
                            }}
                        >
                            <SectionTitle>Preemption</SectionTitle>
                            <StatPair
                                framed={false}
                                items={[
                                    {
                                        label: "Victims",
                                        value: preemption.victims ?? 0,
                                    },
                                    {
                                        label: "Success Rate",
                                        value: preemptionSuccessRate,
                                    },
                                ]}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </OverviewPanel>
    );
};

export default SchedulerMetricsSnapshot;
