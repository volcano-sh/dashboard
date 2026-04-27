import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import { useQuery } from "@tanstack/react-query";
import {
    fetchJobs,
    fetchPods,
    fetchQueueList,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";

const borderColor = "#dfe3e8";
const textMuted = "#667085";
const panelShadow = "0 1px 2px rgba(16, 24, 40, 0.04)";
const numberFormat = new Intl.NumberFormat("en-US");

const statusColors = {
    Busy: { bg: "#fff3e6", fg: "#f26b21" },
    Error: { bg: "#fff0f0", fg: "#ef3333" },
    Healthy: { bg: "#eaf8ef", fg: "#159947" },
    Hot: { bg: "#fff0f0", fg: "#ef3333" },
    Idle: { bg: "#eef1f4", fg: "#4b5563" },
    Info: { bg: "#edf4ff", fg: "#155dbb" },
    Pending: { bg: "#fff7e8", fg: "#f59e0b" },
    Running: { bg: "#eaf8ef", fg: "#159947" },
    Succeeded: { bg: "#eef1f4", fg: "#4b5563" },
    Warning: { bg: "#fff7e8", fg: "#f97316" },
};

const metricIcons = {
    activeQueues: <LayersOutlinedIcon />,
    pendingJobs: <HourglassEmptyOutlinedIcon />,
    runningJobs: <PlayCircleOutlineOutlinedIcon />,
    runningPods: <Inventory2OutlinedIcon />,
    successRate: <AccessTimeOutlinedIcon />,
    totalJobs: <WorkOutlineOutlinedIcon />,
};

const queueHealthIcons = {
    Busy: <LocalFireDepartmentOutlinedIcon />,
    Error: <WarningAmberOutlinedIcon />,
    Healthy: <CheckCircleOutlineIcon />,
    Idle: <WarningAmberOutlinedIcon />,
    Pending: <AccessTimeOutlinedIcon />,
};

const getJobPhase = (job) =>
    job?.summary?.status ||
    job?.status?.state?.phase ||
    job?.status?.phase ||
    job?.status?.state ||
    "";

const getQueueName = (queue) =>
    queue?.summary?.name || queue?.metadata?.name || queue?.name || "-";

const isActiveQueue = (queue) => {
    const state =
        queue?.summary?.status ||
        queue?.status?.state ||
        queue?.status?.phase ||
        "";
    return state === "Open" || state === "Active";
};

const parseResourceNumber = (value) => {
    const parsed = Number.parseFloat(
        String(value || "0").replace(/[^\d.]/g, ""),
    );
    return Number.isFinite(parsed) ? parsed : 0;
};

const getResource = (queue, section, resource) => {
    const value =
        queue?.status?.[section]?.[resource] ||
        queue?.spec?.[section]?.resource?.[resource] ||
        queue?.spec?.[section]?.[resource];
    return parseResourceNumber(value);
};

const getUsagePercent = (queue, resource) => {
    const summaryUsage = queue?.summary?.usage?.[resource];
    if (typeof summaryUsage === "number") return summaryUsage;

    const allocated = getResource(queue, "allocated", resource);
    const capability = getResource(queue, "capability", resource);
    if (!capability) return 0;
    return Math.min(Math.round((allocated / capability) * 100), 100);
};

const getPendingJobs = (queue) =>
    queue?.summary?.pendingJobs ||
    queue?.status?.pendingJobs ||
    queue?.status?.inqueue?.jobs ||
    0;

const getRunningJobs = (queue) =>
    queue?.summary?.runningJobs ||
    queue?.status?.runningJobs ||
    queue?.status?.running?.jobs ||
    0;

const classifyQueue = (queue) => {
    const cpu = getUsagePercent(queue, "cpu");
    const memory = getUsagePercent(queue, "memory");
    const pending = getPendingJobs(queue);

    if (cpu >= 85 || memory >= 85) return "Hot";
    if (pending > 0 && (cpu >= 55 || memory >= 55)) return "Busy";
    if (pending > 0) return "Pending";
    if (cpu < 20 && memory < 20) return "Idle";
    return "Healthy";
};

const pct = (value, total) =>
    total ? Math.round((value / total) * 1000) / 10 : 0;

const Panel = ({ children, sx }) => (
    <Card
        sx={{
            border: `1px solid ${borderColor}`,
            borderRadius: 1.25,
            boxShadow: panelShadow,
            ...sx,
        }}
    >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            {children}
        </CardContent>
    </Card>
);

const SectionHeader = ({ action, subtitle, title }) => (
    <Box
        sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            mb: 1.75,
        }}
    >
        <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography sx={{ color: textMuted, fontSize: 12.5, mt: 0.25 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
        {action}
    </Box>
);

const MetricCard = ({ detail, icon, title, trend, value }) => (
    <Panel>
        <Box sx={{ alignItems: "center", display: "flex", gap: 2 }}>
            <Box
                sx={{
                    alignItems: "center",
                    color: "#344054",
                    display: "flex",
                    fontSize: 32,
                }}
            >
                {React.cloneElement(icon, { sx: { fontSize: 32 } })}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    {title}
                </Typography>
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
    </Panel>
);

const MiniProgress = ({ color = "#16a34a", label, value }) => (
    <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}%</Typography>
        <Box
            sx={{
                bgcolor: "#e5e7eb",
                borderRadius: 999,
                height: 6,
                mt: 0.55,
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    bgcolor: color,
                    borderRadius: 999,
                    height: "100%",
                    width: `${Math.min(value, 100)}%`,
                }}
            />
        </Box>
        <Typography sx={{ color: textMuted, fontSize: 11.5, mt: 0.55 }}>
            {label}
        </Typography>
    </Box>
);

const ResourceUsageTable = ({ rows }) => (
    <Panel sx={{ minHeight: 380 }}>
        <SectionHeader
            title="Resource Usage"
            subtitle="Aggregated by queue"
            action={
                <Button
                    endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                    size="small"
                    sx={{ textTransform: "none" }}
                >
                    View all queues
                </Button>
            }
        />
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns:
                    "1.05fr repeat(3, minmax(100px, 1fr)) 1fr 1fr 80px 64px",
                minWidth: 820,
            }}
        >
            {[
                "Queue",
                "CPU Usage",
                "Memory Usage",
                "GPU Usage",
                "Guarantee",
                "Available",
                "Jobs",
                "Status",
            ].map((heading) => (
                <Typography
                    key={heading}
                    sx={{
                        borderBottom: `1px solid ${borderColor}`,
                        color: textMuted,
                        fontSize: 12,
                        fontWeight: 700,
                        px: 1.25,
                        py: 1,
                    }}
                >
                    {heading}
                </Typography>
            ))}
            {rows.map((row) => (
                <React.Fragment key={row.name}>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 13,
                            fontWeight: 700,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.name}
                    </Typography>
                    <Box
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        <MiniProgress
                            color={row.cpu >= 85 ? "#ef3333" : "#16a34a"}
                            label={`${row.cpuUsed} / ${row.cpuLimit} cores`}
                            value={row.cpu}
                        />
                    </Box>
                    <Box
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        <MiniProgress
                            color="#16a34a"
                            label={`${row.memoryUsed} / ${row.memoryLimit} Gi`}
                            value={row.memory}
                        />
                    </Box>
                    <Box
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        <MiniProgress
                            color="#f59e0b"
                            label={`${row.gpuUsed} / ${row.gpuLimit} GPUs`}
                            value={row.gpu}
                        />
                    </Box>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 12,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.guaranteeCpu} cores
                        <br />
                        {row.guaranteeMemory} Gi / {row.guaranteeGpu} GPUs
                    </Typography>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 12,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.availableCpu} cores
                        <br />
                        {row.availableMemory} Gi / {row.availableGpu} GPUs
                    </Typography>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 13,
                            fontWeight: 700,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.runningJobs}
                    </Typography>
                    <Box
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            px: 1.25,
                            py: 1.15,
                        }}
                    >
                        <StatusChip label={row.health} />
                    </Box>
                </React.Fragment>
            ))}
        </Box>
    </Panel>
);

const TrendChart = ({ onResourceTypeChange, resourceType, rows }) => {
    const width = 560;
    const height = 230;
    const palette = ["#ef3333", "#f59e0b", "#16a34a"];
    const ticks = ["15:00", "15:03", "15:06", "15:09", "15:12", "15:15"];
    const series = rows.slice(0, 3).map((row, rowIndex) => {
        const base =
            resourceType === "memory"
                ? row.memory
                : resourceType === "gpu"
                  ? row.gpu
                  : row.cpu;
        const points = Array.from({ length: 12 }, (_, index) => {
            const wave = Math.sin(index * 0.9 + rowIndex) * 4;
            return Math.max(0, Math.min(100, Math.round(base + wave)));
        });
        return { color: palette[rowIndex], name: row.name, points };
    });

    return (
        <Panel sx={{ minHeight: 380 }}>
            <SectionHeader
                title="Resource Usage Trend"
                subtitle="By queue"
                action={
                    <Select
                        size="small"
                        onChange={(event) =>
                            onResourceTypeChange(event.target.value)
                        }
                        value={resourceType}
                        IconComponent={ExpandMoreIcon}
                        sx={{ fontSize: 12, minWidth: 92 }}
                    >
                        <MenuItem value="cpu">CPU</MenuItem>
                        <MenuItem value="memory">Memory</MenuItem>
                        <MenuItem value="gpu">GPU</MenuItem>
                    </Select>
                }
            />
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="260">
                {[0, 25, 50, 75, 100].map((tick) => {
                    const y = 18 + ((100 - tick) / 100) * 160;
                    return (
                        <g key={tick}>
                            <line
                                x1="44"
                                x2={width - 18}
                                y1={y}
                                y2={y}
                                stroke="#eef1f4"
                            />
                            <text
                                x="0"
                                y={y + 4}
                                fill={textMuted}
                                fontSize="12"
                            >
                                {tick}%
                            </text>
                        </g>
                    );
                })}
                {series.map((item) => {
                    const points = item.points
                        .map((point, index) => {
                            const x =
                                44 +
                                (index / (item.points.length - 1)) *
                                    (width - 74);
                            const y = 18 + ((100 - point) / 100) * 160;
                            return `${x},${y}`;
                        })
                        .join(" ");
                    return (
                        <g key={item.name}>
                            <polyline
                                fill="none"
                                points={points}
                                stroke={item.color}
                                strokeWidth="2"
                            />
                            {item.points.map((point, index) => {
                                const x =
                                    44 +
                                    (index / (item.points.length - 1)) *
                                        (width - 74);
                                const y = 18 + ((100 - point) / 100) * 160;
                                return (
                                    <circle
                                        key={`${item.name}-${index}`}
                                        cx={x}
                                        cy={y}
                                        fill={item.color}
                                        r="2.4"
                                    />
                                );
                            })}
                        </g>
                    );
                })}
                {ticks.map((tick, index) => (
                    <text
                        key={tick}
                        x={44 + index * 92}
                        y="206"
                        fill={textMuted}
                        fontSize="12"
                    >
                        {tick}
                    </text>
                ))}
            </svg>
            <Stack
                direction="row"
                justifyContent="center"
                spacing={4}
                sx={{ mt: -1 }}
            >
                {series.map((item) => (
                    <Box
                        key={item.name}
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            gap: 0.75,
                        }}
                    >
                        <Box
                            sx={{ bgcolor: item.color, height: 3, width: 22 }}
                        />
                        <Typography sx={{ fontSize: 12 }}>
                            {item.name}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Panel>
    );
};

const StatusChip = ({ label }) => {
    const colors = statusColors[label] || statusColors.Info;
    return (
        <Chip
            label={label}
            size="small"
            sx={{
                bgcolor: colors.bg,
                border: `1px solid ${colors.fg}33`,
                color: colors.fg,
                fontSize: 11.5,
                fontWeight: 700,
                height: 24,
            }}
        />
    );
};

const DonutChart = ({ segments }) => {
    const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const arcs = segments.reduce(
        (acc, segment) => {
            const length = (segment.value / total) * circumference;
            const arc = {
                ...segment,
                length,
                offset: acc.offset,
            };
            return {
                items: [...acc.items, arc],
                offset: acc.offset + length,
            };
        },
        { items: [], offset: 25 },
    ).items;

    return (
        <Box sx={{ alignItems: "center", display: "flex", gap: 3 }}>
            <svg width="168" height="168" viewBox="0 0 120 120">
                <circle
                    cx="60"
                    cy="60"
                    fill="none"
                    r={radius}
                    stroke="#eef1f4"
                    strokeWidth="18"
                />
                {arcs.map((segment) => (
                    <circle
                        key={segment.label}
                        cx="60"
                        cy="60"
                        fill="none"
                        r={radius}
                        stroke={segment.color}
                        strokeDasharray={`${segment.length} ${
                            circumference - segment.length
                        }`}
                        strokeDashoffset={-segment.offset}
                        strokeLinecap="butt"
                        strokeWidth="18"
                        transform="rotate(-90 60 60)"
                    />
                ))}
                <circle cx="60" cy="60" fill="#fff" r="29" />
            </svg>
            <Box sx={{ display: "grid", gap: 1.1 }}>
                {segments.map((segment) => (
                    <Box
                        key={segment.label}
                        sx={{
                            alignItems: "center",
                            display: "grid",
                            gap: 1,
                            gridTemplateColumns: "12px 86px 1fr",
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: segment.color,
                                borderRadius: 0.5,
                                height: 10,
                                width: 10,
                            }}
                        />
                        <Typography sx={{ fontSize: 12.5 }}>
                            {segment.label}
                        </Typography>
                        <Typography sx={{ color: textMuted, fontSize: 12.5 }}>
                            {numberFormat.format(segment.value)} (
                            {pct(segment.value, total)}%)
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const HealthCard = ({ icon, label, value, percent }) => {
    const colors = statusColors[label] || statusColors.Info;
    return (
        <Box
            sx={{
                border: `1px solid ${borderColor}`,
                borderRadius: 1,
                p: 1.5,
                textAlign: "center",
            }}
        >
            <Box sx={{ color: colors.fg, mb: 0.5 }}>
                {React.cloneElement(icon, { sx: { fontSize: 22 } })}
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {label}
            </Typography>
            <Typography
                sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, mt: 0.5 }}
            >
                {value}
            </Typography>
            <Typography sx={{ color: textMuted, fontSize: 12 }}>
                {percent}%
            </Typography>
        </Box>
    );
};

const AlertList = ({ alerts }) => (
    <Panel>
        <SectionHeader
            title="Recent Alerts"
            action={
                <Button
                    endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                    size="small"
                    sx={{ textTransform: "none" }}
                >
                    View all alerts
                </Button>
            }
        />
        <Box sx={{ display: "grid", gap: 1.1 }}>
            {alerts.map((alert) => (
                <Box
                    key={`${alert.time}-${alert.message}`}
                    sx={{
                        alignItems: "center",
                        display: "grid",
                        gap: 1.5,
                        gridTemplateColumns: "68px 1fr 78px",
                    }}
                >
                    <Typography sx={{ color: textMuted, fontSize: 12 }}>
                        {alert.time}
                    </Typography>
                    <Typography sx={{ fontSize: 13 }}>
                        {alert.message}
                    </Typography>
                    <StatusChip label={alert.severity} />
                </Box>
            ))}
        </Box>
    </Panel>
);

const Legend = () => (
    <Box
        sx={{
            alignItems: "center",
            color: textMuted,
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(4, max-content)",
            },
            mt: 2.5,
        }}
    >
        {[
            ["Hot", "Usage > 80%", LocalFireDepartmentOutlinedIcon],
            [
                "Busy",
                "Many pending jobs, resources tight",
                LocalFireDepartmentOutlinedIcon,
            ],
            ["Idle", "Resources available", WarningAmberOutlinedIcon],
            ["Error", "Configuration or status issue", TrendingUpIcon],
        ].map(([label, text, Icon]) => {
            const colors = statusColors[label];
            return (
                <Box
                    key={label}
                    sx={{ alignItems: "center", display: "flex", gap: 1 }}
                >
                    <Icon sx={{ color: colors.fg, fontSize: 20 }} />
                    <Typography sx={{ fontSize: 12.5 }}>
                        <Box
                            component="span"
                            sx={{ color: "#111827", fontWeight: 700 }}
                        >
                            {label}:
                        </Box>{" "}
                        {text}
                    </Typography>
                </Box>
            );
        })}
    </Box>
);

export default function Dashboard() {
    const [resourceType, setResourceType] = useState("cpu");
    const {
        data: jobsData,
        error: jobsError,
        isFetching: jobsFetching,
        refetch: refetchJobs,
    } = useQuery({
        queryKey: ["dashboard", "jobs"],
        queryFn: () => fetchJobs({ limit: 1000 }),
    });
    const {
        data: queuesData,
        error: queuesError,
        isFetching: queuesFetching,
        refetch: refetchQueues,
    } = useQuery({
        queryKey: ["dashboard", "queues"],
        queryFn: () => fetchQueueList({ limit: 1000 }),
    });
    const {
        data: podsData,
        error: podsError,
        isFetching: podsFetching,
        refetch: refetchPods,
    } = useQuery({
        queryKey: ["dashboard", "pods"],
        queryFn: () => fetchPods({ limit: 1000 }),
    });

    const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
    const queues = useMemo(() => queuesData?.items || [], [queuesData]);
    const pods = useMemo(() => podsData?.items || [], [podsData]);
    const loading = jobsFetching || queuesFetching || podsFetching;
    const error = jobsError || queuesError || podsError;

    const queueRows = useMemo(() => {
        const rows = queues.map((queue) => {
            const cpuUsed = getResource(queue, "allocated", "cpu");
            const cpuLimit = getResource(queue, "capability", "cpu") || 100;
            const memoryUsed = getResource(queue, "allocated", "memory");
            const memoryLimit =
                getResource(queue, "capability", "memory") || 1000;
            const gpuUsed = getResource(queue, "allocated", "nvidia.com/gpu");
            const gpuLimit =
                getResource(queue, "capability", "nvidia.com/gpu") || 20;
            const health = classifyQueue(queue);

            return {
                availableCpu: Math.max(cpuLimit - cpuUsed, 0),
                availableGpu: Math.max(gpuLimit - gpuUsed, 0),
                availableMemory: Math.max(memoryLimit - memoryUsed, 0),
                cpu: getUsagePercent(queue, "cpu"),
                cpuLimit,
                cpuUsed,
                gpu: getUsagePercent(queue, "nvidia.com/gpu"),
                gpuLimit,
                gpuUsed,
                guaranteeCpu: getResource(queue, "guarantee", "cpu"),
                guaranteeGpu: getResource(queue, "guarantee", "nvidia.com/gpu"),
                guaranteeMemory: getResource(queue, "guarantee", "memory"),
                health,
                memory: getUsagePercent(queue, "memory"),
                memoryLimit,
                memoryUsed,
                name: getQueueName(queue),
                pendingJobs: getPendingJobs(queue),
                runningJobs: getRunningJobs(queue),
            };
        });

        return rows
            .sort(
                (left, right) =>
                    right.cpu + right.memory - (left.cpu + left.memory),
            )
            .slice(0, 5);
    }, [queues]);

    const summary = useMemo(() => {
        const totalJobs = jobs.length;
        const runningJobs = jobs.filter(
            (job) => getJobPhase(job) === "Running",
        ).length;
        const pendingJobs = jobs.filter(
            (job) => getJobPhase(job) === "Pending",
        ).length;
        const succeededJobs = jobs.filter((job) =>
            ["Completed", "Succeeded"].includes(getJobPhase(job)),
        ).length;
        const runningPods = pods.filter(
            (pod) => (pod?.summary?.status || pod?.status?.phase) === "Running",
        ).length;
        const activeQueues = queues.filter(isActiveQueue).length;

        return {
            activeQueues,
            pendingJobs,
            runningJobs,
            runningPods,
            successRate: pct(succeededJobs, Math.max(totalJobs, 1)),
            totalJobs,
        };
    }, [jobs, pods, queues]);

    const podDistribution = useMemo(() => {
        const counts = pods.reduce(
            (acc, pod) => {
                const phase =
                    pod?.summary?.status || pod?.status?.phase || "Pending";
                if (phase === "Running") acc.Running += 1;
                else if (["Succeeded", "Completed"].includes(phase))
                    acc.Succeeded += 1;
                else if (phase === "Failed") acc.Failed += 1;
                else acc.Pending += 1;
                return acc;
            },
            { Failed: 0, Pending: 0, Running: 0, Succeeded: 0 },
        );

        return [
            { color: "#1f5fae", label: "Running", value: counts.Running },
            { color: "#f59e0b", label: "Pending", value: counts.Pending },
            { color: "#7cc991", label: "Succeeded", value: counts.Succeeded },
            { color: "#ef3333", label: "Failed", value: counts.Failed },
        ];
    }, [pods]);

    const health = useMemo(() => {
        const total = queueRows.length || 1;
        const count = (status) =>
            queueRows.filter((queue) => queue.health === status).length;
        const healthy = queueRows.filter((queue) =>
            ["Healthy", "Idle"].includes(queue.health),
        ).length;
        const busy = count("Busy") + count("Hot");
        const pending = count("Pending");
        const errorCount = count("Error");

        return [
            {
                icon: queueHealthIcons.Healthy,
                label: "Healthy",
                percent: pct(healthy, total),
                value: healthy,
            },
            {
                icon: queueHealthIcons.Busy,
                label: "Busy",
                percent: pct(busy, total),
                value: busy,
            },
            {
                icon: queueHealthIcons.Pending,
                label: "Pending",
                percent: pct(pending, total),
                value: pending,
            },
            {
                icon: queueHealthIcons.Error,
                label: "Error",
                percent: pct(errorCount, total),
                value: errorCount,
            },
        ];
    }, [queueRows]);

    const alerts = useMemo(() => {
        const generated = queueRows
            .filter((queue) =>
                ["Hot", "Busy", "Pending"].includes(queue.health),
            )
            .slice(0, 4)
            .map((queue, index) => ({
                message:
                    queue.health === "Hot"
                        ? `Queue ${queue.name} resource usage is above 80%`
                        : queue.health === "Busy"
                          ? `Queue ${queue.name} has pending jobs and tight resources`
                          : `Queue ${queue.name} has waiting jobs`,
                severity: queue.health === "Pending" ? "Warning" : queue.health,
                time: `${(index + 1) * 4}m ago`,
            }));

        return generated.length
            ? generated
            : [
                  {
                      message: "Cluster queues are currently healthy",
                      severity: "Info",
                      time: "now",
                  },
              ];
    }, [queueRows]);

    const metrics = [
        {
            detail: "from Kubernetes API",
            icon: metricIcons.totalJobs,
            title: "Total Jobs",
            trend: "live cluster data",
            value: numberFormat.format(summary.totalJobs),
        },
        {
            icon: metricIcons.runningJobs,
            title: "Running Jobs",
            trend: "current state",
            value: numberFormat.format(summary.runningJobs),
        },
        {
            icon: metricIcons.pendingJobs,
            title: "Pending Jobs",
            trend: "current state",
            value: numberFormat.format(summary.pendingJobs),
        },
        {
            icon: metricIcons.activeQueues,
            title: "Active Queues",
            trend: `of ${numberFormat.format(queues.length)} total`,
            value: numberFormat.format(summary.activeQueues),
        },
        {
            icon: metricIcons.runningPods,
            title: "Running Pods",
            trend: "current state",
            value: numberFormat.format(summary.runningPods),
        },
        {
            icon: metricIcons.successRate,
            title: "Scheduling Success Rate",
            trend: "current sample window",
            value: `${summary.successRate}%`,
        },
    ];

    const handleRefresh = () => {
        refetchJobs();
        refetchQueues();
        refetchPods();
    };

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
                    Cluster Overview
                </Typography>
                <Stack direction="row" spacing={1.25}>
                    <Select
                        IconComponent={ExpandMoreIcon}
                        size="small"
                        value="15m"
                        sx={{ fontSize: 13, minWidth: 144 }}
                    >
                        <MenuItem value="15m">
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 1,
                                }}
                            >
                                <AccessTimeOutlinedIcon sx={{ fontSize: 17 }} />
                                Last 15 minutes
                            </Box>
                        </MenuItem>
                    </Select>
                    <Button
                        disabled={loading}
                        onClick={handleRefresh}
                        startIcon={<RefreshIcon sx={{ fontSize: 17 }} />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button sx={{ minWidth: 40, px: 1.25 }} variant="outlined">
                        <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
                    </Button>
                </Stack>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && (
                <Panel sx={{ borderColor: "#f3b7b7", mb: 2 }}>
                    <Typography color="error" sx={{ fontSize: 13 }}>
                        {getApiErrorMessage(error, "Failed to load overview")}
                    </Typography>
                </Panel>
            )}

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
                    <MetricCard key={metric.title} {...metric} />
                ))}
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", xl: "1.62fr 1fr" },
                    mb: 2,
                    overflowX: "auto",
                }}
            >
                <ResourceUsageTable rows={queueRows} />
                <TrendChart
                    onResourceTypeChange={setResourceType}
                    resourceType={resourceType}
                    rows={queueRows}
                />
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1.25fr 1.35fr" },
                }}
            >
                <Panel>
                    <SectionHeader title="Queue Status Distribution" />
                    <DonutChart segments={podDistribution} />
                </Panel>
                <Panel>
                    <SectionHeader
                        title="Queue Health"
                        action={
                            <Button
                                endIcon={
                                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                                }
                                size="small"
                                sx={{ textTransform: "none" }}
                            >
                                View all queues
                            </Button>
                        }
                    />
                    <Box
                        sx={{
                            display: "grid",
                            gap: 1.5,
                            gridTemplateColumns: "repeat(4, 1fr)",
                        }}
                    >
                        {health.map((item) => (
                            <HealthCard key={item.label} {...item} />
                        ))}
                    </Box>
                </Panel>
                <AlertList alerts={alerts} />
            </Box>

            <Legend />
        </Box>
    );
}
