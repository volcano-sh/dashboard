import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    InputAdornment,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
    API_BASE,
    fetchQueueEvents,
    fetchQueueYaml,
    updateQueueYaml,
} from "../../lib/client/dashboard-api";
import CreateDialog from "../CreateDialog";
import QueuePagination from "./QueuePagination";
import { buildQueueTree } from "./utils/queueTreeBuilder";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import ResourceDetailDrawer from "../details/ResourceDetailDrawer";
import ResourceEventsPanel from "../details/ResourceEventsPanel";
import YamlViewer from "../details/YamlViewer";
import { tableNameSx, tableNumericSx } from "../scheduling/tableDataStyles";
import SchedulingStatusChip from "../scheduling/SchedulingStatusChip";
import {
    getUsageToneColor,
    ResourceStatusLegend,
} from "../scheduling/ResourceStatus";
import {
    QueueResourceUsageBars,
    QueueResourceUsageDetailBar,
} from "./QueueResourceUsageView";
import {
    getQueueResourceStats,
    getQueueUsageSummary,
    QUEUE_RESOURCE_COLUMNS,
} from "./queueResourceUsage";

const getQueueName = (queue) => queue?.metadata?.name || "-";

const getStatus = (queue) => {
    const state = queue?.spec?.state || queue?.status?.state || "Open";
    if (state === "Active") return "Open";
    return state;
};

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
};

const healthStyles = {
    healthy: {
        bgcolor: "#e7f6ec",
        color: "#12833f",
        label: "Healthy",
        severity: "healthy",
    },
    hot: {
        bgcolor: "#ffe7e7",
        color: "#cf2727",
        label: "Hot",
        severity: "hot",
    },
    idle: {
        bgcolor: "#f2f3f5",
        color: "#69707a",
        label: "Idle",
        severity: "idle",
    },
    underused: {
        bgcolor: "#fff8db",
        color: "#a16207",
        label: "Underused",
        severity: "underused",
    },
    invalid: {
        bgcolor: "#ffe5e5",
        color: "#d92323",
        label: "Invalid",
        severity: "invalid",
    },
    starving: {
        bgcolor: "#fff2df",
        color: "#d86b00",
        label: "Starving",
        severity: "starving",
    },
};

const statusStyles = {
    Open: {
        background: "#e7f6ec",
        border: "#12833f22",
        color: "#12833f",
        label: "Open",
        tooltip: "Queue accepts jobs and participates in scheduling",
    },
    Closed: {
        background: "#f2f3f5",
        border: "#69707a22",
        color: "#69707a",
        label: "Closed",
        tooltip: "Queue is disabled for new scheduling",
    },
};

const getHealth = (queue) => {
    const status = getStatus(queue).toLowerCase();
    if (status.includes("invalid")) {
        return healthStyles.invalid;
    }

    const stats = QUEUE_RESOURCE_COLUMNS.map((resource) =>
        getQueueResourceStats(queue, resource),
    );
    const pendingJobs = Number(getPendingJobs(queue)) || 0;
    const runningJobsText = getRunningPodsJobs(queue);
    const runningJobs =
        Number(String(runningJobsText).split("/")[1]?.trim()) || 0;
    const maxUsage = Math.max(
        ...stats.map((resource) => resource.usagePercent),
    );
    const overLimit = stats.some((resource) => resource.overCapability);

    if (runningJobs === 0 && pendingJobs === 0) return healthStyles.idle;
    if (pendingJobs > 0 && maxUsage < 50) return healthStyles.starving;
    if (overLimit || maxUsage > 110) return healthStyles.hot;
    if (pendingJobs > 0 && maxUsage < 70) return healthStyles.underused;
    if (maxUsage >= 70 && maxUsage <= 110) return healthStyles.healthy;
    return maxUsage === 0 ? healthStyles.idle : healthStyles.healthy;
};

const getPriority = (queue, level) =>
    queue?.spec?.priority ?? queue?.spec?.weight ?? level;

const getRunningPodsJobs = (queue) => {
    const runningPods =
        queue?.status?.runningPods ??
        queue?.status?.runningPodCount ??
        queue?.status?.running ??
        0;
    const runningJobs =
        queue?.status?.runningJobs ??
        queue?.status?.runningJobCount ??
        queue?.status?.runningApplications ??
        0;
    return `${runningPods} / ${runningJobs}`;
};

const getPendingJobs = (queue) =>
    queue?.status?.pendingJobs ??
    queue?.status?.pendingJobCount ??
    queue?.status?.pendingApplications ??
    0;

const getQueueSearchBlob = (queue) => {
    const labels = Object.entries(queue?.metadata?.labels || {})
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");
    return [
        queue?.metadata?.name,
        queue?.metadata?.namespace,
        queue?.spec?.parent,
        labels,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
};

const buildPath = (queue, queueMap) => {
    const names = [getQueueName(queue)];
    let parentName = queue?.spec?.parent;
    const visited = new Set(names);

    while (parentName && queueMap.has(parentName) && !visited.has(parentName)) {
        names.unshift(parentName);
        visited.add(parentName);
        parentName = queueMap.get(parentName)?.spec?.parent;
    }

    if (names[0] !== "root") names.unshift("root");
    return names.join(" / ");
};

type DetailRowProps = {
    label: React.ReactNode;
    value?: React.ReactNode;
    valueNode?: React.ReactNode;
};

const DetailRow = ({ label, value, valueNode }: DetailRowProps) => (
    <Box
        sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "90px 1fr",
            py: 0.65,
        }}
    >
        <Typography sx={{ fontSize: 13 }}>{label}:</Typography>
        <Box sx={{ fontSize: 13 }}>{valueNode || value}</Box>
    </Box>
);

const HealthBadge = ({ health }) => (
    <SchedulingStatusChip
        minWidth={78}
        status={health.label}
        tone={{
            background: health.bgcolor,
            border: `${health.color}22`,
            color: health.color,
            label: health.label,
        }}
    />
);

const StatusBadge = ({ state }) => {
    const status = statusStyles[state] || {
        background: "#f2f3f5",
        border: "#69707a22",
        color: "#69707a",
        label: state || "Unknown",
        tooltip: "Queue state reported by Volcano",
    };

    return (
        <SchedulingStatusChip
            minWidth={68}
            showTooltipIcon
            status={status.label}
            tone={status}
        />
    );
};

const QueueTreeCell = ({
    expanded,
    hasChildren,
    level,
    node,
    onSelectQueue,
    onToggle,
}) => {
    const queueName = getQueueName(node);

    return (
        <TableCell>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    gap: 0.75,
                    pl: level * 2.2,
                    position: "relative",
                }}
            >
                {level > 0 && (
                    <Box
                        sx={{
                            borderBottom: "1px solid #cfd5dc",
                            borderLeft: "1px solid #cfd5dc",
                            height: 22,
                            left: level * 17 - 7,
                            position: "absolute",
                            top: -2,
                            width: 14,
                        }}
                    />
                )}
                <IconButton
                    onClick={(event) => {
                        event.stopPropagation();
                        if (hasChildren) onToggle(queueName);
                    }}
                    size="small"
                    sx={{ height: 24, width: 24, zIndex: 1 }}
                >
                    {hasChildren ? (
                        expanded ? (
                            <ExpandMoreIcon sx={{ fontSize: 15 }} />
                        ) : (
                            <ChevronRightIcon sx={{ fontSize: 15 }} />
                        )
                    ) : (
                        <Box sx={{ width: 15 }} />
                    )}
                </IconButton>
                {expanded && hasChildren ? (
                    <FolderOpenOutlinedIcon sx={{ fontSize: 16, zIndex: 1 }} />
                ) : (
                    <FolderOutlinedIcon sx={{ fontSize: 16, zIndex: 1 }} />
                )}
                <Typography
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelectQueue(node);
                    }}
                    sx={{
                        color: level ? "#1677ff" : "text.primary",
                        cursor: "pointer",
                        zIndex: 1,
                        ...tableNameSx,
                    }}
                >
                    {queueName}
                </Typography>
            </Box>
        </TableCell>
    );
};

const detailCardSx = {
    border: "1px solid #dfe3e8",
    borderRadius: 1.25,
    boxShadow: "none",
    p: 2,
};

const BooleanInfoValue = ({ label, value }) => (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.55 }}>
        <Typography sx={{ color: value ? "#12833f" : "#69707a", fontSize: 13 }}>
            {String(value)}
        </Typography>
        <Tooltip title={`${label} is configured on the queue spec.`}>
            <InfoOutlinedIcon sx={{ color: "text.disabled", fontSize: 14 }} />
        </Tooltip>
    </Box>
);

const LabelChips = ({ labels }) => {
    const entries = Object.entries(labels || {});
    if (!entries.length)
        return <Typography sx={{ fontSize: 13 }}>-</Typography>;

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65 }}>
            {entries.slice(0, 4).map(([key, value]) => (
                <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    sx={{
                        bgcolor: "#e8f2ff",
                        color: "#1266c3",
                        fontSize: 11,
                        height: 22,
                    }}
                />
            ))}
            {entries.length > 4 && (
                <Chip
                    label={`+${entries.length - 4}`}
                    size="small"
                    sx={{ fontSize: 11, height: 22 }}
                />
            )}
        </Box>
    );
};

const BasicInfoCard = ({ queueMap, selectedQueue }) => {
    const queueName = getQueueName(selectedQueue);
    const annotations = Object.keys(selectedQueue?.metadata?.annotations || {});

    return (
        <Paper sx={detailCardSx}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.25 }}>
                Basic Information
            </Typography>
            <DetailRow label="Name" value={queueName} />
            <DetailRow
                label="Path"
                value={buildPath(selectedQueue, queueMap)}
            />
            <DetailRow
                label="Parent"
                value={selectedQueue?.spec?.parent || "root"}
            />
            <DetailRow
                label="State"
                valueNode={<StatusBadge state={getStatus(selectedQueue)} />}
            />
            <DetailRow label="Priority" value={getPriority(selectedQueue, 0)} />
            <DetailRow
                label="Preemptable"
                valueNode={
                    <BooleanInfoValue
                        label="Preemptable"
                        value={selectedQueue?.spec?.reclaimable ?? true}
                    />
                }
            />
            <DetailRow
                label="Reclaimable"
                valueNode={
                    <BooleanInfoValue
                        label="Reclaimable"
                        value={selectedQueue?.spec?.reclaimable ?? true}
                    />
                }
            />
            <DetailRow
                label="Created At"
                value={formatDate(selectedQueue?.metadata?.creationTimestamp)}
            />
            <DetailRow
                label="Updated At"
                value={formatDate(
                    selectedQueue?.metadata?.managedFields?.[0]?.time ||
                        selectedQueue?.metadata?.creationTimestamp,
                )}
            />
            <DetailRow
                label="Labels"
                valueNode={
                    <LabelChips labels={selectedQueue?.metadata?.labels} />
                }
            />
            <DetailRow label="Annotations" value={annotations.length || "-"} />
        </Paper>
    );
};

const HealthCard = ({ selectedQueue }) => {
    const health = getHealth(selectedQueue);
    const { stats, usagePercent } = getQueueUsageSummary(selectedQueue);
    const pendingJobs = getPendingJobs(selectedQueue);
    const runningJobs =
        String(getRunningPodsJobs(selectedQueue)).split("/")[1]?.trim() || 0;

    return (
        <Paper sx={detailCardSx}>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                }}
            >
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    Health Status
                </Typography>
                <HealthBadge health={health} />
            </Box>
            <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                <Typography sx={{ fontSize: 13 }}>
                    Using {usagePercent}% of deserved resources
                </Typography>
                <Tooltip title="Calculated from aggregate used / deserved resources.">
                    <InfoOutlinedIcon
                        sx={{ color: "text.disabled", fontSize: 14 }}
                    />
                </Tooltip>
            </Box>
            <Typography
                color="text.secondary"
                sx={{ fontSize: 13, fontWeight: 700, mt: 3, mb: 1.25 }}
            >
                Health Indicators
            </Typography>
            <Box sx={{ display: "grid", gap: 1.25 }}>
                {stats.map((item) => (
                    <Box
                        key={item.label}
                        sx={{
                            alignItems: "center",
                            display: "grid",
                            gap: 1,
                            gridTemplateColumns: "1fr 58px",
                        }}
                    >
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 0.9,
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor:
                                        item.label === "CPU"
                                            ? "#16a34a"
                                            : item.label === "Memory"
                                              ? "#2563eb"
                                              : "#7c3aed",
                                    borderRadius: "50%",
                                    height: 9,
                                    width: 9,
                                }}
                            />
                            <Typography sx={{ fontSize: 13 }}>
                                {item.label} Usage
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                color: getUsageToneColor(item.usageTone),
                                fontFamily:
                                    '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                                fontSize: 13,
                                textAlign: "right",
                            }}
                        >
                            {item.usageLabel}
                        </Typography>
                    </Box>
                ))}
                {[
                    ["Pending Jobs", pendingJobs],
                    ["Running Jobs", runningJobs],
                ].map(([label, value]) => (
                    <Box
                        key={label}
                        sx={{
                            alignItems: "center",
                            display: "grid",
                            gap: 1,
                            gridTemplateColumns: "1fr 58px",
                        }}
                    >
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 0.9,
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: "#c7ccd3",
                                    borderRadius: "50%",
                                    height: 9,
                                    width: 9,
                                }}
                            />
                            <Typography sx={{ fontSize: 13 }}>
                                {label}
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                fontFamily:
                                    '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                                fontSize: 13,
                                textAlign: "right",
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

const ResourceSummaryCard = ({ selectedQueue }) => {
    const [mode, setMode] = useState("absolute");

    return (
        <Paper sx={{ ...detailCardSx, gridColumn: "1 / -1" }}>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1.5,
                }}
            >
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                        Resource Summary
                    </Typography>
                    <Tooltip title="Guarantee, deserved, capability, and current usage for this queue.">
                        <InfoOutlinedIcon
                            sx={{ color: "text.disabled", fontSize: 14 }}
                        />
                    </Tooltip>
                </Box>
                <Box
                    sx={{
                        border: "1px solid #dfe3e8",
                        borderRadius: 1,
                        display: "flex",
                        overflow: "hidden",
                    }}
                >
                    {[
                        ["absolute", "Absolute"],
                        ["percentage", "Percentage"],
                    ].map(([value, label]) => (
                        <Button
                            key={value}
                            onClick={() => setMode(value)}
                            size="small"
                            sx={{
                                bgcolor: mode === value ? "#f4f7fb" : "#ffffff",
                                borderRadius: 0,
                                color:
                                    mode === value ? "#0f63c8" : "text.primary",
                                fontSize: 12,
                                fontWeight: 700,
                                minWidth: 92,
                                textTransform: "none",
                            }}
                        >
                            {label}
                        </Button>
                    ))}
                </Box>
            </Box>
            <ResourceStatusLegend />
            <Box sx={{ mt: 1.5 }}>
                {QUEUE_RESOURCE_COLUMNS.map((resource) => (
                    <QueueResourceUsageDetailBar
                        key={resource.key}
                        mode={mode}
                        queue={selectedQueue}
                        resource={resource}
                    />
                ))}
            </Box>
        </Paper>
    );
};

const getQueueEvents = (queue) => {
    const createdAt = formatDate(queue?.metadata?.creationTimestamp);
    return [
        {
            description: "Queue created",
            time: createdAt,
            type: "Normal",
        },
        {
            description: `Queue state changed to ${getStatus(queue)}`,
            time: createdAt,
            type: "Normal",
        },
        getPendingJobs(queue)
            ? {
                  description:
                      "Insufficient resources, some workloads are waiting pending",
                  time: createdAt,
                  type: "Warning",
              }
            : null,
    ].filter(Boolean);
};

const QueueEventsCard = ({ selectedQueue }) => (
    <Paper sx={{ ...detailCardSx, gridColumn: "1 / -1" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>
            Recent Events
        </Typography>
        <Box sx={{ display: "grid", gap: 1.25 }}>
            {getQueueEvents(selectedQueue).map((event, index) => (
                <Box
                    key={`${event.description}-${index}`}
                    sx={{
                        alignItems: "center",
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: "100px 180px 1fr",
                    }}
                >
                    <Box
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            gap: 0.75,
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor:
                                    event.type === "Warning"
                                        ? "#f97316"
                                        : "#16a34a",
                                borderRadius: "50%",
                                height: 9,
                                width: 9,
                            }}
                        />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {event.type}
                        </Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        {event.time}
                    </Typography>
                    <Typography sx={{ fontSize: 13 }}>
                        {event.description}
                    </Typography>
                </Box>
            ))}
        </Box>
    </Paper>
);

const QueueOverviewPanel = ({ queueMap, selectedQueue }) => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
    >
        <BasicInfoCard queueMap={queueMap} selectedQueue={selectedQueue} />
        <HealthCard selectedQueue={selectedQueue} />
        <ResourceSummaryCard selectedQueue={selectedQueue} />
        <QueueEventsCard selectedQueue={selectedQueue} />
    </Box>
);

const QueueDetailsPanel = ({
    onClose,
    onYamlSaved,
    queueMap,
    selectedQueue,
}) => {
    const [selectedTab, setSelectedTab] = useState("overview");
    const queueName = getQueueName(selectedQueue);
    const yamlQuery = useQuery({
        enabled: Boolean(selectedQueue && selectedTab === "configuration"),
        queryFn: () => fetchQueueYaml(queueName),
        queryKey: ["queueYaml", queueName],
    });

    return (
        <ResourceDetailDrawer
            activeTab={selectedTab}
            icon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />}
            meta={[
                {
                    label: "Path",
                    value: selectedQueue
                        ? buildPath(selectedQueue, queueMap)
                        : "-",
                },
                {
                    label: "Parent",
                    value: selectedQueue?.spec?.parent || "root",
                },
                {
                    label: "State",
                    valueNode: selectedQueue ? (
                        <StatusBadge state={getStatus(selectedQueue)} />
                    ) : null,
                },
            ]}
            onClose={onClose}
            onTabChange={setSelectedTab}
            open={Boolean(selectedQueue)}
            tabs={[
                { label: "Overview", value: "overview" },
                { label: "YAML", value: "configuration" },
                { label: "Events", value: "events" },
            ]}
            title={`Queue: ${queueName}`}
            renderTab={(tab) =>
                tab === "configuration" ? (
                    <YamlViewer
                        data={yamlQuery.data}
                        editable
                        error={yamlQuery.error}
                        fill
                        isLoading={yamlQuery.isLoading || yamlQuery.isFetching}
                        onSubmit={async (manifest) => {
                            await updateQueueYaml(queueName, manifest);
                            await yamlQuery.refetch();
                            await onYamlSaved?.();
                        }}
                    />
                ) : tab === "events" ? (
                    <ResourceEventsPanel
                        emptyText="No queue events available."
                        errorMessage="Failed to fetch queue events"
                        queryFn={() => fetchQueueEvents(queueName)}
                        queryKey={["queueEvents", queueName]}
                    />
                ) : (
                    <QueueOverviewPanel
                        queueMap={queueMap}
                        selectedQueue={selectedQueue}
                    />
                )
            }
        />
    );
};

const QueueSummaryCards = ({ queues, totalQueues }) => {
    const summary = useMemo(() => {
        const healthCounts = queues.reduce(
            (acc, queue) => {
                acc[getHealth(queue).severity] =
                    (acc[getHealth(queue).severity] || 0) + 1;
                return acc;
            },
            {
                healthy: 0,
                hot: 0,
                idle: 0,
                invalid: 0,
                starving: 0,
                underused: 0,
            },
        );
        const active = queues.filter((queue) => getStatus(queue) === "Open");

        return {
            active: active.length,
            hot: healthCounts.hot || 0,
            idle: healthCounts.idle || 0,
            invalid: healthCounts.invalid || 0,
            starving: healthCounts.starving || 0,
            total: totalQueues || queues.length,
        };
    }, [queues, totalQueues]);

    const cards = [
        {
            label: "Total Queues",
            meta: "Total configured queues",
            value: summary.total,
        },
        {
            dot: "#16a34a",
            label: "Active Queues",
            meta: "Open queues",
            value: summary.active,
        },
        {
            color: "#ef4444",
            label: "Hot Queues",
            meta: "Usage > 110% of deserved",
            value: summary.hot,
        },
        {
            color: "#f97316",
            label: "Starving Queues",
            meta: "Pending jobs but underused",
            value: summary.starving,
        },
        {
            color: "#69707a",
            label: "Idle Queues",
            meta: "No running or pending jobs",
            value: summary.idle,
        },
        {
            color: "#64748b",
            label: "Invalid Queues",
            meta: "Configuration issues",
            value: summary.invalid,
        },
    ];

    return (
        <Box
            sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(6, minmax(0, 1fr))",
                },
                mb: 2,
            }}
        >
            {cards.map((card) => (
                <Paper
                    key={card.label}
                    sx={{
                        border: "1px solid #dfe3e8",
                        borderRadius: 1.5,
                        boxShadow: "none",
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
                        {card.dot && (
                            <Box
                                sx={{
                                    bgcolor: card.dot,
                                    borderRadius: "50%",
                                    height: 10,
                                    width: 10,
                                }}
                            />
                        )}
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 13, fontWeight: 700 }}
                        >
                            {card.label}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "grid",
                            gap: 0.5,
                        }}
                    >
                        <Typography
                            sx={{
                                color: card.color || "text.primary",
                                fontSize: 24,
                                fontWeight: 600,
                                letterSpacing: -0.5,
                            }}
                        >
                            {card.value}
                        </Typography>
                        {card.meta && (
                            <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12, lineHeight: 1.3 }}
                            >
                                {card.meta}
                            </Typography>
                        )}
                    </Box>
                </Paper>
            ))}
        </Box>
    );
};

const QueueLegends = () => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "0.9fr 1.4fr" },
            mt: 2,
        }}
    >
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1.5,
                boxShadow: "none",
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>
                Resource Bar Explanation
            </Typography>
            <Box sx={{ px: 1 }}>
                <Box
                    sx={{
                        bgcolor: "#d8dadd",
                        borderRadius: 999,
                        height: 6,
                        mb: 1,
                        overflow: "visible",
                        position: "relative",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "#16a34a",
                            height: "100%",
                            left: 0,
                            position: "absolute",
                            width: "28%",
                        }}
                    />
                    <Box
                        sx={{
                            bgcolor: "#3b82f6",
                            height: "100%",
                            left: "28%",
                            position: "absolute",
                            width: "32%",
                        }}
                    />
                    <Box
                        sx={{
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "8px solid #7c3aed",
                            height: 0,
                            left: "74%",
                            position: "absolute",
                            top: -8,
                            width: 0,
                        }}
                    />
                </Box>
                <Box
                    sx={{
                        color: "text.secondary",
                        display: "flex",
                        fontSize: 12,
                        justifyContent: "space-between",
                    }}
                >
                    <span>Guarantee (G)</span>
                    <span>Deserved</span>
                    <span>Used / Capability</span>
                </Box>
            </Box>
        </Paper>
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1.5,
                boxShadow: "none",
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>
                Health Status
            </Typography>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                {[
                    ["#cf2727", "Hot: used / deserved > 110%"],
                    ["#d86b00", "Starving: pending jobs and usage < 50%"],
                    ["#a16207", "Underused: pending jobs and usage < 70%"],
                    ["#12833f", "Healthy: usage between 70% and 110%"],
                    ["#69707a", "Idle: no running or pending jobs"],
                    ["#ef4444", "Invalid: invalid configuration"],
                ].map(([color, label]) => (
                    <Box
                        key={label}
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            gap: 0.75,
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: color,
                                borderRadius: "50%",
                                height: 8,
                                width: 8,
                            }}
                        />
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 12 }}
                        >
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    </Box>
);

const QueueHierarchyView = ({
    treeData,
    selectedQueue,
    queueMap,
    onSelectQueue,
    pagination,
    totalQueues,
    onPageChange,
    onRowsPerPageChange,
    onCloseQueueDetails,
    onYamlSaved,
}) => {
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    useEffect(() => {
        const expandable = new Set();
        const collect = (nodes) => {
            nodes.forEach((node) => {
                if (node.children?.length > 0) {
                    expandable.add(getQueueName(node));
                    collect(node.children);
                }
            });
        };
        collect(treeData);
        setExpandedNodes(expandable);
    }, [treeData]);

    const handleToggle = (queueName) => {
        setExpandedNodes((previous) => {
            const next = new Set(previous);
            if (next.has(queueName)) next.delete(queueName);
            else next.add(queueName);
            return next;
        });
    };

    const visibleRows = useMemo(() => {
        const rows = [];
        const visit = (nodes, level = 0) => {
            nodes.forEach((node) => {
                rows.push({ node, level });
                if (
                    node.children?.length &&
                    expandedNodes.has(getQueueName(node))
                ) {
                    visit(node.children, level + 1);
                }
            });
        };
        visit(treeData);
        return rows;
    }, [expandedNodes, treeData]);

    return (
        <Box
            sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                    xs: "1fr",
                    xl: "minmax(820px, 1fr)",
                },
            }}
        >
            <Paper
                sx={{
                    border: "1px solid #dfe3e8",
                    borderRadius: 1.5,
                    boxShadow: "none",
                    minHeight: 680,
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        alignItems: "center",
                        display: "flex",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                        Queue Hierarchy ({totalQueues || visibleRows.length})
                    </Typography>
                    <IconButton size="small">
                        <SettingsOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                </Box>
                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 980 }}>
                        <TableHead>
                            <TableRow
                                sx={{
                                    "& th": {
                                        color: "text.secondary",
                                        fontSize: 12,
                                        fontWeight: 700,
                                    },
                                }}
                            >
                                <TableCell
                                    sx={{
                                        bgcolor: "#ffffff",
                                        borderBottom: "1px solid #dfe3e8",
                                        minWidth: 210,
                                    }}
                                >
                                    Queue Name
                                </TableCell>
                                <TableCell sx={{ minWidth: 104 }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ minWidth: 70 }}>
                                    Priority
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ minWidth: 420 }}
                                >
                                    <Box
                                        sx={{
                                            alignItems: "center",
                                            display: "grid",
                                            gap: 0.75,
                                        }}
                                    >
                                        <span>
                                            Resources (CPU / Memory / GPU)
                                        </span>
                                        <ResourceStatusLegend />
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ minWidth: 140 }}>
                                    Running Pods / Jobs
                                </TableCell>
                                <TableCell sx={{ minWidth: 105 }}>
                                    Pending Jobs
                                </TableCell>
                                <TableCell sx={{ minWidth: 110 }}>
                                    Health
                                </TableCell>
                                <TableCell sx={{ width: 72 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibleRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        No queues found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleRows.map(({ node, level }) => {
                                    const queueName = getQueueName(node);
                                    const hasChildren =
                                        node.children?.length > 0;
                                    const expanded =
                                        expandedNodes.has(queueName);
                                    const selected =
                                        getQueueName(selectedQueue) ===
                                        queueName;
                                    const health = getHealth(node);

                                    return (
                                        <TableRow
                                            hover
                                            key={queueName}
                                            onClick={() => onSelectQueue(node)}
                                            sx={{
                                                bgcolor: selected
                                                    ? "#fff7f3"
                                                    : "inherit",
                                                cursor: "pointer",
                                                height: 64,
                                                "& td": {
                                                    borderBottom:
                                                        "1px solid #e6e9ed",
                                                    color: "text.primary",
                                                    fontSize: 13,
                                                },
                                            }}
                                        >
                                            <QueueTreeCell
                                                expanded={expanded}
                                                hasChildren={hasChildren}
                                                level={level}
                                                node={node}
                                                onSelectQueue={onSelectQueue}
                                                onToggle={handleToggle}
                                            />
                                            <TableCell>
                                                <StatusBadge
                                                    state={getStatus(node)}
                                                />
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getPriority(node, level)}
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 420 }}>
                                                <QueueResourceUsageBars
                                                    queue={node}
                                                />
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getRunningPodsJobs(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getPendingJobs(node)}
                                            </TableCell>
                                            <TableCell>
                                                <HealthBadge health={health} />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small">
                                                    <MoreVertIcon
                                                        sx={{ fontSize: 16 }}
                                                    />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box
                    sx={{
                        alignItems: "center",
                        borderTop: "1px solid #dfe3e8",
                        display: "flex",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Typography sx={{ fontSize: 13 }}>
                        Total {totalQueues || visibleRows.length}
                    </Typography>
                    <QueuePagination
                        pagination={pagination}
                        totalQueues={totalQueues || visibleRows.length}
                        handleChangeRowsPerPage={onRowsPerPageChange}
                        handleChangePage={onPageChange}
                    />
                </Box>
            </Paper>
            <QueueLegends />
            <QueueDetailsPanel
                onClose={onCloseQueueDetails}
                onYamlSaved={onYamlSaved}
                selectedQueue={selectedQueue}
                queueMap={queueMap}
            />
        </Box>
    );
};

const Queues = () => {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 });
    const [totalQueues, setTotalQueues] = useState(0);
    const [filters, setFilters] = useState({
        queue: "All",
    });

    const fetchQueues = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                search: searchText,
                state: "All",
                queue: filters.queue,
                page: pagination.page,
                limit: pagination.rowsPerPage,
            };

            const response = await axios.get(`${API_BASE}/queues`, { params });
            setQueues(response.data.items || []);
            setTotalQueues(response.data.totalCount || 0);
        } catch (err) {
            setError("Failed to fetch queues: " + err.message);
            setQueues([]);
            setTotalQueues(0);
        } finally {
            setLoading(false);
        }
    }, [filters.queue, pagination.page, pagination.rowsPerPage, searchText]);

    useEffect(() => {
        fetchQueues();
    }, [fetchQueues]);

    const filteredQueues = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return queues.filter((queue) => {
            const matchesQueue =
                filters.queue === "All" ||
                getQueueName(queue) === filters.queue;
            const matchesSearch =
                !query || getQueueSearchBlob(queue).includes(query);
            return matchesQueue && matchesSearch;
        });
    }, [filters.queue, queues, searchText]);

    const queueMap = useMemo(() => {
        return new Map(
            filteredQueues.map((queue) => [getQueueName(queue), queue]),
        );
    }, [filteredQueues]);

    const treeData = useMemo(
        () => buildQueueTree(filteredQueues),
        [filteredQueues],
    );

    const selectedQueue = useMemo(() => {
        if (selectedQueueName && queueMap.has(selectedQueueName)) {
            return queueMap.get(selectedQueueName);
        }
        return null;
    }, [queueMap, selectedQueueName]);

    const handleCreateQueue = async (newQueue) => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE}/queues`, newQueue);

            if (response.status !== 201) {
                alert("Failed to create queue: " + response.statusText);
                return;
            }

            setCreateDialogOpen(false);
            fetchQueues();
        } catch (err) {
            alert(
                "Network error: " + (err?.response?.data?.error || err.message),
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback((event) => {
        setSearchText(event.target.value);
        setPagination((previous) => ({ ...previous, page: 1 }));
    }, []);

    const handleResetFilters = useCallback(() => {
        setSearchText("");
        setFilters({
            queue: "All",
        });
        setPagination((previous) => ({ ...previous, page: 1 }));
    }, []);

    const handleChangePage = (event, newPage) => {
        setPagination((previous) => ({ ...previous, page: newPage }));
    };

    const handleChangeRowsPerPage = (event) => {
        setPagination((previous) => ({
            ...previous,
            rowsPerPage: Number(event.target.value),
            page: 1,
        }));
    };

    const queueFilterOptions = useMemo(
        () => ["All", ...new Set(queues.map((queue) => getQueueName(queue)))],
        [queues],
    );

    const filterFields = useMemo(
        () => [
            {
                key: "queue",
                label: "Queue",
                onChange: (value) => {
                    setFilters((prev) => ({ ...prev, queue: value }));
                    setPagination((prev) => ({ ...prev, page: 1 }));
                },
                options: queueFilterOptions,
                type: "select",
                value: filters.queue,
            },
            {
                key: "search",
                label: "Search",
                onChange: (value) => handleSearch({ target: { value } }),
                placeholder: "Search name, label, parent...",
                sx: {
                    flex: { xs: "1 1 100%", lg: "0 0 320px" },
                    minWidth: { xs: "100%", lg: 320 },
                },
                textFieldProps: {
                    InputProps: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    },
                },
                type: "text",
                value: searchText,
            },
        ],
        [filters.queue, handleSearch, queueFilterOptions, searchText],
    );

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography
                    component="h1"
                    sx={{ fontSize: 24, fontWeight: 600, letterSpacing: 0.2 }}
                >
                    Queues
                </Typography>
                <Typography
                    color="text.secondary"
                    sx={{ fontSize: 13, mt: 0.5 }}
                >
                    Inspect scheduling state and resource pressure across CPU,
                    memory, and GPU.
                </Typography>
            </Box>

            {error && (
                <Card
                    sx={{
                        border: "1px solid #f5c2c7",
                        boxShadow: "none",
                        mb: 2,
                    }}
                >
                    <CardContent sx={{ py: 1.5 }}>
                        <Typography color="error" sx={{ fontSize: 14 }}>
                            {error}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <QueueSummaryCards queues={queues} totalQueues={totalQueues} />

            <Box
                sx={{
                    alignItems: { xs: "stretch", md: "flex-start" },
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 1.5,
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Box sx={{ flex: 1 }}>
                    <SchedulingTableFilters fields={filterFields} />
                </Box>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                    <Button
                        onClick={handleResetFilters}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Reset
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={fetchQueues}
                        startIcon={<RefreshIcon fontSize="small" />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{
                            bgcolor: "#ff4d2d",
                            textTransform: "none",
                            "&:hover": { bgcolor: "#e84325" },
                        }}
                        variant="contained"
                    >
                        Create Queue
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <QueueHierarchyView
                treeData={treeData}
                selectedQueue={selectedQueue}
                queueMap={queueMap}
                pagination={pagination}
                totalQueues={filteredQueues.length || totalQueues}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                onSelectQueue={(queue) =>
                    setSelectedQueueName(getQueueName(queue))
                }
                onCloseQueueDetails={() => setSelectedQueueName("")}
                onYamlSaved={fetchQueues}
            />

            <CreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreate={handleCreateQueue}
                title="Create a Queue"
                resourceNameLabel="Queue Name"
                resourceType="Queue"
            />
        </Box>
    );
};

export default Queues;
