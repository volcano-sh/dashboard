import React, { useMemo } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    Box as BoxIcon,
    BriefcaseBusiness,
    ChevronDown,
    ChevronRight,
    Clock3,
    Flame,
    Layers,
    ListChecks,
    LockKeyhole,
    PlayCircle,
    RefreshCw,
    Settings,
    SlidersHorizontal,
    TimerReset,
    TrendingUp,
    UsersRound,
} from "lucide-react";
import {
    fetchJobs,
    fetchPods,
    fetchQueueList,
    fetchSchedulerConfig,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";

const iconProps = { size: 28, strokeWidth: 1.8 };

const numberFormat = new Intl.NumberFormat("en-US");

const getJobPhase = (job) =>
    job?.summary?.status ||
    job?.status?.state?.phase ||
    job?.status?.phase ||
    job?.status?.state ||
    "";

const getQueueName = (queue) =>
    queue?.summary?.name || queue?.metadata?.name || queue?.name || "-";

const getQueueStatus = (queue) => {
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
    if (queue?.summary?.usage?.[resource]) return queue.summary.usage[resource];
    const allocated = getResource(queue, "allocated", resource);
    const capability = getResource(queue, "capability", resource);
    if (!capability) return 0;
    return Math.min(Math.round((allocated / capability) * 100), 100);
};

const getPending = (queue) =>
    queue?.summary?.pending?.cpu ||
    getResource(queue, "pending", "cpu") ||
    getResource(queue, "inqueue", "cpu");

const getQueueHealth = (queue) => {
    if (queue?.summary?.health) return queue.summary.health;
    const cpu = getUsagePercent(queue, "cpu");
    const memory = getUsagePercent(queue, "memory");
    const pending = getPending(queue);

    if (cpu >= 80 || memory >= 80) return "Hot";
    if (pending > 0 && cpu < 35) return "Starving";
    if (queue?.spec?.parent && pending > 0) return "Blocked";
    if (cpu < 15 && memory < 15) return "Idle";
    return "Healthy";
};

const getHealthSx = (health) => {
    const palette = {
        Hot: { bgcolor: "#ffe0e0", color: "#cf2e2e" },
        Starving: { bgcolor: "#fff0dc", color: "#e87500" },
        Blocked: { bgcolor: "#eadffb", color: "#6f42c1" },
        Idle: { bgcolor: "#eceff3", color: "#5f6b7a" },
        Healthy: { bgcolor: "#dbf5e2", color: "#1f7a3a" },
    };
    return palette[health] || palette.Idle;
};

const SectionTitle = ({ children }) => (
    <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 1.25 }}>
        {children}
    </Typography>
);

const Panel = ({ children, sx = {} }) => (
    <Card
        sx={{
            border: "1px solid #dfe3e8",
            borderRadius: 1.5,
            boxShadow: "none",
            ...sx,
        }}
    >
        <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
            {children}
        </CardContent>
    </Card>
);

const SummaryCard = ({ icon, title, value, detail }) => (
    <Panel>
        <Box sx={{ alignItems: "center", display: "flex", gap: 2 }}>
            <Box sx={{ color: "#5f6b7a", display: "flex" }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontSize: 13 }}>{title}</Typography>
                <Typography sx={{ fontSize: 27, fontWeight: 800, mt: 0.25 }}>
                    {value}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                    {detail}
                </Typography>
            </Box>
        </Box>
    </Panel>
);

const QuickCheckCard = ({
    icon,
    title,
    value,
    subtitle,
    color = "#111827",
}) => (
    <Panel>
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2 }}>
            <Box sx={{ color: "#5f6b7a", display: "flex", pt: 0.25 }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                    {title}
                </Typography>
                <Typography sx={{ color, fontSize: 28, fontWeight: 800 }}>
                    {value}
                </Typography>
                <Typography sx={{ fontSize: 12 }}>{subtitle}</Typography>
                <Button
                    endIcon={<ChevronRight size={14} />}
                    size="small"
                    sx={{ mt: 0.5, p: 0, textTransform: "none" }}
                >
                    View all
                </Button>
            </Box>
        </Box>
    </Panel>
);

const Legend = () => (
    <Box
        sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 3 }}
    >
        {[
            ["#ff5c57", "Hot: usage > 80%"],
            ["#ffa940", "Starving: pending high, usage low"],
            ["#a78bfa", "Blocked: blocked by parent"],
            ["#ff8f87", "Invalid: config issue"],
        ].map(([color, label]) => (
            <Box
                key={label}
                sx={{ alignItems: "center", display: "flex", gap: 1 }}
            >
                <Box
                    sx={{
                        bgcolor: color,
                        borderRadius: 0.5,
                        height: 8,
                        width: 8,
                    }}
                />
                <Typography sx={{ fontSize: 12 }}>{label}</Typography>
            </Box>
        ))}
    </Box>
);

const ResourceUsageBars = ({ data }) => (
    <Box sx={{ display: "grid", gap: 1 }}>
        {data.map(({ name, usage }) => (
            <Box
                key={name}
                sx={{
                    alignItems: "center",
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: "64px 1fr 36px",
                }}
            >
                <Typography sx={{ fontSize: 12, textAlign: "right" }}>
                    {name}
                </Typography>
                <Box
                    sx={{
                        bgcolor: "#edf0f4",
                        height: 10,
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "#7b8490",
                            height: "100%",
                            width: `${usage}%`,
                        }}
                    />
                </Box>
                <Typography sx={{ fontSize: 12 }}>{usage}%</Typography>
            </Box>
        ))}
        <Box
            sx={{
                color: "text.secondary",
                display: "flex",
                fontSize: 12,
                justifyContent: "space-between",
                ml: "72px",
                mt: 0.5,
            }}
        >
            {[0, 20, 40, 60, 80, 100].map((tick) => (
                <span key={tick}>{tick}%</span>
            ))}
        </Box>
        <Typography
            color="text.secondary"
            sx={{ fontSize: 12, mt: -0.25, textAlign: "center" }}
        >
            Usage (%)
        </Typography>
    </Box>
);

const LineSparkline = ({ points }) => {
    if (points.length < 2) {
        return (
            <EmptyChart>
                Not enough historical data from current resources.
            </EmptyChart>
        );
    }

    const width = 460;
    const height = 145;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const coords = points
        .map((point, index) => {
            const x = (index / (points.length - 1)) * width;
            const y = height - ((point - min) / (max - min || 1)) * 80 - 30;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="165">
            {[250, 500, 750, 1000].map((tick, index) => (
                <line
                    key={tick}
                    x1="0"
                    x2={width}
                    y1={height - 20 - index * 30}
                    y2={height - 20 - index * 30}
                    stroke="#edf0f4"
                    strokeWidth="1"
                />
            ))}
            <polyline
                fill="none"
                points={coords}
                stroke="#6b7280"
                strokeWidth="2"
            />
        </svg>
    );
};

const EmptyChart = ({ children }) => (
    <Box
        sx={{
            alignItems: "center",
            border: "1px dashed #cfd5dd",
            color: "text.secondary",
            display: "flex",
            fontSize: 12,
            height: 165,
            justifyContent: "center",
        }}
    >
        {children}
    </Box>
);

const ThroughputChart = ({ bars }) => {
    if (!bars.length) {
        return <EmptyChart>No scheduled job data available.</EmptyChart>;
    }

    const max = Math.max(...bars);
    return (
        <Box
            sx={{
                alignItems: "end",
                borderBottom: "1px solid #cfd5dd",
                borderLeft: "1px solid #cfd5dd",
                display: "flex",
                gap: 0.7,
                height: 165,
                px: 1,
                pt: 1,
            }}
        >
            {bars.map((value, index) => (
                <Box
                    key={`${value}-${index}`}
                    sx={{
                        bgcolor: "#c9ced6",
                        border: "1px solid #77808d",
                        height: `${Math.max((value / max) * 100, 8)}%`,
                        width: "100%",
                    }}
                />
            ))}
        </Box>
    );
};

const Dashboard = () => {
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
    const {
        data: schedulerConfig,
        error: schedulerError,
        isFetching: schedulerFetching,
        refetch: refetchSchedulerConfig,
    } = useQuery({
        queryKey: ["dashboard", "scheduler", "config"],
        queryFn: fetchSchedulerConfig,
    });

    const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
    const queues = useMemo(() => queuesData?.items || [], [queuesData]);
    const pods = useMemo(() => podsData?.items || [], [podsData]);
    const loading =
        jobsFetching || queuesFetching || podsFetching || schedulerFetching;
    const error = jobsError || queuesError || podsError || schedulerError;

    const summary = useMemo(() => {
        const totalJobs = jobs.length;
        const runningJobs = jobs.filter(
            (job) => getJobPhase(job) === "Running",
        ).length;
        const pendingJobs = jobs.filter(
            (job) => getJobPhase(job) === "Pending",
        ).length;
        const activeQueues = queues.filter(getQueueStatus).length;
        const runningPods = pods.filter(
            (pod) => (pod?.summary?.status || pod?.status?.phase) === "Running",
        ).length;

        return {
            activeQueues,
            pendingJobs,
            runningJobs,
            runningPods,
            totalJobs,
        };
    }, [jobs, pods, queues]);

    const riskQueues = useMemo(() => {
        const derived = queues.map((queue) => {
            const cpu = getUsagePercent(queue, "cpu");
            const memory = getUsagePercent(queue, "memory");
            const pending = Math.round(getPending(queue));
            const health = getQueueHealth(queue);

            return {
                name: getQueueName(queue),
                pending,
                cpu,
                memory,
                gpu: getUsagePercent(queue, "nvidia.com/gpu"),
                guarantee: getResource(queue, "guarantee", "cpu"),
                deserved: getResource(queue, "deserved", "cpu"),
                capability: getResource(queue, "capability", "cpu"),
                health,
                reason:
                    health === "Hot"
                        ? "usage high"
                        : health === "Starving"
                          ? "pending high"
                          : health === "Blocked"
                            ? "parent limit"
                            : health === "Idle"
                              ? "reclaimable"
                              : "normal",
            };
        });

        const visible = derived
            .sort((a, b) => b.pending + b.cpu - (a.pending + a.cpu))
            .slice(0, 6);

        return visible;
    }, [queues]);

    const quickStats = useMemo(() => {
        const active = summary.activeQueues;
        const pending = riskQueues.filter((queue) => queue.pending > 0).length;
        const hot = riskQueues.filter((queue) => queue.health === "Hot").length;
        const starving = riskQueues.filter(
            (queue) => queue.health === "Starving",
        ).length;
        const blocked = riskQueues.filter(
            (queue) => queue.health === "Blocked",
        ).length;

        return {
            active,
            blocked,
            hot,
            invalid: queues.filter(
                (queue) =>
                    !Object.keys(queue.summary?.resources?.capability || {})
                        .length,
            ).length,
            pending,
            starving,
        };
    }, [queues, riskQueues, summary.activeQueues]);

    const resourceUsage = useMemo(() => {
        const derived = queues
            .map((queue) => ({
                name: getQueueName(queue),
                usage: getUsagePercent(queue, "cpu"),
            }))
            .filter((queue) => queue.usage > 0)
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 6);

        return derived;
    }, [queues]);

    const pendingTrend = useMemo(() => {
        const pendingJobs = jobs.filter(
            (job) => getJobPhase(job) === "Pending",
        );
        if (pendingJobs.length < 2) return [];
        return pendingJobs
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.metadata?.creationTimestamp) -
                    new Date(b.metadata?.creationTimestamp),
            )
            .map((_, index) => index + 1);
    }, [jobs]);

    const throughputBars = useMemo(() => {
        const scheduledJobs = jobs.filter((job) =>
            ["Running", "Completed", "Succeeded"].includes(getJobPhase(job)),
        );
        return scheduledJobs
            .slice(-30)
            .map((job) => Math.max(job.summary?.tasks?.length || 1, 1));
    }, [jobs]);

    const schedulerRows = useMemo(
        () => [
            ["Scheduler Name", schedulerConfig?.scheduler?.name],
            [
                "Actions",
                schedulerConfig?.scheduler?.actions?.length
                    ? schedulerConfig.scheduler.actions.join(", ")
                    : "-",
            ],
            ["Queue Ordering", schedulerConfig?.policies?.queueOrder],
            ["Job Order", schedulerConfig?.policies?.jobOrder],
            ["Resource Order", schedulerConfig?.policies?.resourceOrder],
            ["Node Order", schedulerConfig?.policies?.nodeOrder],
            [
                "Plugins",
                schedulerConfig?.plugins?.length
                    ? schedulerConfig.plugins
                          .map((plugin) => plugin.name)
                          .join(", ")
                    : "-",
            ],
            [
                "Preemption",
                schedulerConfig?.preemption?.enabled ? "Enabled" : "Disabled",
            ],
        ],
        [schedulerConfig],
    );

    const handleRefresh = () => {
        refetchJobs();
        refetchQueues();
        refetchPods();
        refetchSchedulerConfig();
    };

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 2.5 }}>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "flex-end",
                    mb: 2,
                }}
            >
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                    <Select
                        size="small"
                        value="15m"
                        IconComponent={ChevronDown}
                        sx={{ fontSize: 13, minWidth: 130 }}
                    >
                        <MenuItem value="15m">
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 1,
                                }}
                            >
                                <Clock3 size={17} />
                                Last 15m
                            </Box>
                        </MenuItem>
                    </Select>
                    <Button
                        disabled={loading}
                        onClick={handleRefresh}
                        startIcon={<RefreshCw size={17} />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button sx={{ minWidth: 40, px: 1.25 }} variant="outlined">
                        <Settings size={18} />
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && (
                <Panel sx={{ borderColor: "#f3b7b7", mb: 2 }}>
                    <Typography color="error" sx={{ fontSize: 13 }}>
                        {getApiErrorMessage(error, "Failed to load overview")}
                    </Typography>
                </Panel>
            )}

            <SectionTitle>Global Summary</SectionTitle>
            <Box
                sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, 1fr)",
                        xl: "repeat(6, 1fr)",
                    },
                    mb: 2.5,
                }}
            >
                <SummaryCard
                    detail="from Kubernetes API"
                    icon={<BriefcaseBusiness {...iconProps} />}
                    title="Total Jobs"
                    value={numberFormat.format(summary.totalJobs)}
                />
                <SummaryCard
                    detail="current state"
                    icon={<PlayCircle {...iconProps} />}
                    title="Running Jobs"
                    value={numberFormat.format(summary.runningJobs)}
                />
                <SummaryCard
                    detail="current state"
                    icon={<TimerReset {...iconProps} />}
                    title="Pending Jobs"
                    value={numberFormat.format(summary.pendingJobs)}
                />
                <SummaryCard
                    detail={`of ${numberFormat.format(queues.length)} total`}
                    icon={<Layers {...iconProps} />}
                    title="Active Queues"
                    value={numberFormat.format(summary.activeQueues)}
                />
                <SummaryCard
                    detail="current state"
                    icon={<BoxIcon {...iconProps} />}
                    title="Running Pods"
                    value={numberFormat.format(summary.runningPods)}
                />
                <SummaryCard
                    detail={`${schedulerConfig?.plugins?.length || 0} plugins`}
                    icon={<SlidersHorizontal {...iconProps} />}
                    title="Scheduler Policy"
                    value={schedulerConfig?.scheduler?.name || "-"}
                />
            </Box>

            <SectionTitle>Queue Quick Check</SectionTitle>
            <Box
                sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, 1fr)",
                        xl: "repeat(6, 1fr)",
                    },
                    mb: 2,
                }}
            >
                <QuickCheckCard
                    icon={<UsersRound {...iconProps} />}
                    subtitle="Active Queues"
                    title="Q-Active"
                    value={quickStats.active}
                />
                <QuickCheckCard
                    color="#ff8500"
                    icon={<Clock3 {...iconProps} />}
                    subtitle="Queues w/ Pending"
                    title="Q-Pending"
                    value={quickStats.pending}
                />
                <QuickCheckCard
                    color="#f12f2f"
                    icon={<Flame {...iconProps} />}
                    subtitle="Usage > 80%"
                    title="Q-Hot"
                    value={quickStats.hot}
                />
                <QuickCheckCard
                    color="#ff8500"
                    icon={<TrendingUp {...iconProps} />}
                    subtitle="Pending high, usage low"
                    title="Q-Starving"
                    value={quickStats.starving}
                />
                <QuickCheckCard
                    color="#6f42c1"
                    icon={<LockKeyhole {...iconProps} />}
                    subtitle="Blocked by parent"
                    title="Q-Blocked"
                    value={quickStats.blocked}
                />
                <QuickCheckCard
                    color="#f12f2f"
                    icon={<AlertTriangle {...iconProps} />}
                    subtitle="Config invalid"
                    title="Q-Invalid"
                    value={quickStats.invalid}
                />
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", lg: "2fr 1.25fr" },
                    mb: 2,
                }}
            >
                <Panel>
                    <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 1 }}>
                        Top Risk Queues
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {[
                                        "Queue",
                                        "Pending",
                                        "CPU",
                                        "Memory",
                                        "GPU",
                                        "Guarantee",
                                        "Deserved",
                                        "Capability",
                                        "Health",
                                        "Reason",
                                    ].map((header) => (
                                        <TableCell
                                            key={header}
                                            sx={{
                                                borderColor: "#edf0f4",
                                                fontSize: 12,
                                            }}
                                        >
                                            {header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {riskQueues.map((queue) => (
                                    <TableRow key={queue.name}>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.name}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.pending}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.cpu}%
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.memory}%
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.gpu}%
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.guarantee}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.deserved}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.capability}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={queue.health}
                                                size="small"
                                                sx={{
                                                    ...getHealthSx(
                                                        queue.health,
                                                    ),
                                                    fontSize: 12,
                                                    height: 22,
                                                    minWidth: 68,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12 }}>
                                            {queue.reason}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider sx={{ my: 1.5 }} />
                    <Legend />
                </Panel>

                <Box sx={{ display: "grid", gap: 2 }}>
                    <Panel>
                        <Typography
                            sx={{ fontSize: 16, fontWeight: 800, mb: 1.25 }}
                        >
                            Scheduler Config Summary
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gap: 1,
                                gridTemplateColumns: "1fr 1fr",
                            }}
                        >
                            {schedulerRows.map(([label, value]) => (
                                <Box key={label}>
                                    <Typography sx={{ fontSize: 12 }}>
                                        {label}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12 }}>
                                        {value || "-"}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Panel>
                    <Panel>
                        <Typography
                            sx={{ fontSize: 16, fontWeight: 800, mb: 1.25 }}
                        >
                            Allocation Rule Check
                        </Typography>
                        {[
                            ["✓", "Queues loaded from API", queues.length],
                            ["✓", "Jobs loaded from API", jobs.length],
                            ["✓", "Pods loaded from API", pods.length],
                            [
                                schedulerConfig ? "✓" : "×",
                                "Scheduler ConfigMap readable",
                                schedulerConfig?.target?.name || "-",
                            ],
                            [
                                quickStats.invalid === 0 ? "✓" : "×",
                                "Queues with missing capability",
                                quickStats.invalid,
                            ],
                        ].map(([mark, label, count]) => (
                            <Box
                                key={label}
                                sx={{
                                    alignItems: "center",
                                    display: "grid",
                                    gap: 1,
                                    gridTemplateColumns: "20px 1fr auto",
                                    py: 0.25,
                                }}
                            >
                                <Typography
                                    sx={{
                                        color:
                                            mark === "✓"
                                                ? "#16a34a"
                                                : "#ef3333",
                                        fontSize: 16,
                                    }}
                                >
                                    {mark}
                                </Typography>
                                <Typography sx={{ fontSize: 12 }}>
                                    {label}
                                </Typography>
                                <Typography sx={{ fontSize: 12 }}>
                                    {count}
                                </Typography>
                            </Box>
                        ))}
                        <Button
                            endIcon={<ChevronRight size={14} />}
                            size="small"
                            sx={{ mt: 0.5, p: 0, textTransform: "none" }}
                        >
                            View invalid queues
                        </Button>
                    </Panel>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr 1fr" },
                }}
            >
                <Panel>
                    <Box
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1.5,
                        }}
                    >
                        <Typography sx={{ fontSize: 16, fontWeight: 800 }}>
                            Queue Resource Usage (Aggregate)
                        </Typography>
                        <Button
                            endIcon={<ChevronDown size={14} />}
                            size="small"
                            variant="outlined"
                        >
                            CPU
                        </Button>
                    </Box>
                    <ResourceUsageBars data={resourceUsage} />
                </Panel>
                <Panel>
                    <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 1 }}>
                        Pending Jobs Trend
                    </Typography>
                    <Box
                        sx={{
                            alignItems: "center",
                            color: "text.secondary",
                            display: "flex",
                            fontSize: 12,
                            gap: 1,
                            ml: 4,
                        }}
                    >
                        <ListChecks size={14} />
                        Total Pending Jobs
                    </Box>
                    <LineSparkline points={pendingTrend} />
                </Panel>
                <Panel>
                    <Typography sx={{ fontSize: 16, fontWeight: 800, mb: 1 }}>
                        Scheduling Throughput
                    </Typography>
                    <Box
                        sx={{
                            alignItems: "center",
                            color: "text.secondary",
                            display: "flex",
                            fontSize: 12,
                            gap: 1,
                            ml: 4,
                            mb: 1,
                        }}
                    >
                        <ListChecks size={14} />
                        Scheduled Jobs
                    </Box>
                    <ThroughputChart bars={throughputBars} />
                </Panel>
            </Box>
        </Box>
    );
};

export default Dashboard;
