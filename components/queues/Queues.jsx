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
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { API_BASE, fetchQueueYaml } from "../../lib/client/dashboard-api";
import CreateDialog from "../CreateDialog";
import QueuePagination from "./QueuePagination";
import { buildQueueTree } from "./utils/queueTreeBuilder";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import ResourceDetailDrawer from "../details/ResourceDetailDrawer";
import YamlViewer from "../details/YamlViewer";
import {
    tableIdentifierSx,
    tableNumericSx,
} from "../scheduling/tableDataStyles";

const formatResource = (value, fallback = "0") => {
    if (value === undefined || value === null || value === "") return fallback;
    return String(value);
};

const getQueueName = (queue) => queue?.metadata?.name || "-";

const getStatus = (queue) => {
    const state = queue?.status?.state || "Unknown";
    return state === "Open" ? "Active" : state;
};

const getSpecResource = (queue, key, resourceKey) => {
    const section = queue?.spec?.[key];
    if (!section) return undefined;
    return section?.resource?.[resourceKey] || section?.[resourceKey];
};

const getStatusResource = (queue, key, resourceKey) => {
    return queue?.status?.[key]?.[resourceKey];
};

const getAllocatedCpu = (queue) =>
    formatResource(getStatusResource(queue, "allocated", "cpu"));

const getAllocatedMemory = (queue) =>
    formatResource(getStatusResource(queue, "allocated", "memory"));

const getPendingCpu = (queue) =>
    formatResource(
        getStatusResource(queue, "pending", "cpu") ||
            getStatusResource(queue, "inqueue", "cpu"),
    );

const getPendingMemory = (queue) =>
    formatResource(
        getStatusResource(queue, "pending", "memory") ||
            getStatusResource(queue, "inqueue", "memory"),
    );

const getCapabilityCpu = (queue) =>
    formatResource(getSpecResource(queue, "capability", "cpu"));

const getCapabilityMemory = (queue) =>
    formatResource(getSpecResource(queue, "capability", "memory"));

const getDeservedCpu = (queue) =>
    formatResource(getSpecResource(queue, "deserved", "cpu"));

const getDeservedMemory = (queue) =>
    formatResource(getSpecResource(queue, "deserved", "memory"));

const getGuaranteeCpu = (queue) =>
    formatResource(getSpecResource(queue, "guarantee", "cpu"));

const getGuaranteeMemory = (queue) =>
    formatResource(getSpecResource(queue, "guarantee", "memory"));

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
};

const parseNumber = (value) => {
    const parsed = Number.parseFloat(
        String(value || "0").replace(/[^\d.]/g, ""),
    );
    return Number.isFinite(parsed) ? parsed : 0;
};

const RESOURCE_COLUMNS = [
    {
        key: "cpu",
        label: "CPU",
        resourceKey: "cpu",
        unit: "cores",
    },
    {
        key: "memory",
        label: "Memory",
        resourceKey: "memory",
        unit: "Gi",
    },
    {
        key: "gpu",
        label: "GPU",
        resourceKey: "nvidia.com/gpu",
        fallbackKeys: ["gpu"],
        unit: "GPUs",
    },
];

const getResourceFromSection = (queue, section, resource) => {
    const keys = [resource.resourceKey, ...(resource.fallbackKeys || [])];
    for (const key of keys) {
        const value =
            section === "status"
                ? getStatusResource(queue, "allocated", key)
                : getSpecResource(queue, section, key);
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return undefined;
};

const getPendingResource = (queue, resource) => {
    const keys = [resource.resourceKey, ...(resource.fallbackKeys || [])];
    for (const key of keys) {
        const value =
            getStatusResource(queue, "pending", key) ||
            getStatusResource(queue, "inqueue", key);
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return undefined;
};

const getResourceStats = (queue, resource) => {
    const guaranteeRaw = getResourceFromSection(queue, "guarantee", resource);
    const usedRaw = getResourceFromSection(queue, "status", resource);
    const capabilityRaw = getResourceFromSection(queue, "capability", resource);
    const guarantee = parseNumber(guaranteeRaw);
    const used = parseNumber(usedRaw);
    const capability = parseNumber(capabilityRaw);
    const limit = Math.max(capability, guarantee, used);
    const usagePercent = limit ? Math.min((used / limit) * 100, 100) : 0;
    const guaranteePercent = limit
        ? Math.min((guarantee / limit) * 100, 100)
        : 0;

    return {
        capability,
        capabilityLabel: formatResource(capabilityRaw, "0"),
        guarantee,
        guaranteeLabel: formatResource(guaranteeRaw, "0"),
        guaranteePercent,
        limit,
        pendingLabel: formatResource(getPendingResource(queue, resource)),
        usagePercent,
        used,
        usedLabel: formatResource(usedRaw, "0"),
    };
};

const getHealth = (queue) => {
    const status = getStatus(queue).toLowerCase();
    if (status.includes("invalid") || status.includes("closed")) {
        return {
            bgcolor: "#ffe5e5",
            color: "#d92323",
            label: "Invalid",
            severity: "invalid",
        };
    }

    const stats = RESOURCE_COLUMNS.map((resource) =>
        getResourceStats(queue, resource),
    );
    const overLimit = stats.some(
        (resource) => resource.capability && resource.used > resource.capability,
    );
    const maxUsage = Math.max(...stats.map((resource) => resource.usagePercent));

    if (overLimit || maxUsage >= 80) {
        return {
            bgcolor: "#ffe7e7",
            color: "#cf2727",
            label: "Hot",
            severity: "hot",
        };
    }
    if (maxUsage >= 50) {
        return {
            bgcolor: "#fff2df",
            color: "#d86b00",
            label: "Busy",
            severity: "busy",
        };
    }
    if (maxUsage === 0) {
        return {
            bgcolor: "#f2f3f5",
            color: "#69707a",
            label: "Idle",
            severity: "idle",
        };
    }
    return {
        bgcolor: "#e7f6ec",
        color: "#12833f",
        label: "Normal",
        severity: "normal",
    };
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

const getUsageColor = (percent) => {
    if (percent >= 80) return "#ff3b30";
    if (percent >= 50) return "#ff8a00";
    return "#18a957";
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

const DetailRow = ({ label, value }) => (
    <Box
        sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "90px 1fr",
            py: 0.65,
        }}
    >
        <Typography sx={{ fontSize: 13 }}>{label}:</Typography>
        <Box sx={{ fontSize: 13 }}>{value}</Box>
    </Box>
);

const ResourceUsageBar = ({ queue, resource }) => {
    const stats = getResourceStats(queue, resource);
    const usagePercent = Math.round(stats.usagePercent);
    const guaranteeWidth = Math.min(
        stats.guaranteePercent,
        stats.usagePercent,
    );
    const borrowingLeft = Math.min(
        stats.guaranteePercent,
        stats.usagePercent,
    );
    const borrowingWidth = Math.max(stats.usagePercent - borrowingLeft, 0);
    const overLimit = stats.capability && stats.used > stats.capability;

    return (
        <Box sx={{ minWidth: 140 }}>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Typography sx={{ fontSize: 12, minWidth: 38 }}>
                    {usagePercent}%
                </Typography>
                <Box
                    sx={{
                        bgcolor: "#e1e4e8",
                        borderRadius: 999,
                        height: 5,
                        overflow: "hidden",
                        position: "relative",
                        width: 116,
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "#16a34a",
                            height: "100%",
                            left: 0,
                            position: "absolute",
                            top: 0,
                            width: `${guaranteeWidth}%`,
                        }}
                    />
                    <Box
                        sx={{
                            bgcolor: overLimit
                                ? "#ef4444"
                                : getUsageColor(usagePercent),
                            height: "100%",
                            left: `${borrowingLeft}%`,
                            position: "absolute",
                            top: 0,
                            width: `${borrowingWidth}%`,
                        }}
                    />
                    <Box
                        sx={{
                            bgcolor: "#111827",
                            height: 8,
                            left: `${Math.min(stats.guaranteePercent, 100)}%`,
                            opacity: stats.guarantee ? 0.7 : 0,
                            position: "absolute",
                            top: -1.5,
                            width: 1,
                        }}
                    />
                </Box>
            </Box>
            <Typography
                color="text.secondary"
                sx={{
                    fontFamily:
                        '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                    fontSize: 11,
                    mt: 0.35,
                    pl: "46px",
                    whiteSpace: "nowrap",
                }}
            >
                {stats.guaranteeLabel} / {stats.usedLabel} /{" "}
                {stats.capabilityLabel} {resource.unit}
            </Typography>
        </Box>
    );
};

const UsageMeter = ({ queue, resource }) => {
    const stats = getResourceStats(queue, resource);
    const percent = Math.round(stats.usagePercent);
    return (
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Typography sx={{ fontSize: 12, minWidth: 34 }}>
                {percent}%
            </Typography>
            <Box
                sx={{
                    bgcolor: "#ebedf0",
                    borderRadius: 999,
                    height: 4,
                    overflow: "hidden",
                    width: 42,
                }}
            >
                <Box
                    sx={{
                        bgcolor: getUsageColor(percent),
                        height: "100%",
                        width: `${percent}%`,
                    }}
                />
            </Box>
        </Box>
    );
};

const ResourcePair = ({ title, cpu, memory }) => (
    <Box sx={{ mb: 1.5 }}>
        <Typography
            color="text.secondary"
            sx={{ fontSize: 12, fontWeight: 700, mb: 1 }}
        >
            {title}
        </Typography>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
            <Typography sx={{ fontSize: 12 }}>CPU&nbsp;&nbsp;{cpu}</Typography>
            <Typography sx={{ fontSize: 12 }}>
                Memory&nbsp;&nbsp;{memory}
            </Typography>
        </Box>
    </Box>
);

const QueueTreeItem = ({
    node,
    level = 0,
    expandedNodes,
    selectedName,
    onToggle,
    onSelect,
}) => {
    const hasChildren = node.children?.length > 0;
    const expanded = expandedNodes.has(getQueueName(node));
    const selected = selectedName === getQueueName(node);

    return (
        <Box>
            <Box
                onClick={() => onSelect(node)}
                sx={{
                    alignItems: "center",
                    bgcolor: selected ? "#e5e5e5" : "transparent",
                    borderRadius: 1,
                    cursor: "pointer",
                    display: "flex",
                    gap: 1,
                    minHeight: 38,
                    ml: level * 2.25,
                    px: 1,
                    "&:hover": {
                        bgcolor: selected ? "#e5e5e5" : "#f3f4f6",
                    },
                }}
            >
                <IconButton
                    size="small"
                    onClick={(event) => {
                        event.stopPropagation();
                        if (hasChildren) onToggle(getQueueName(node));
                    }}
                    sx={{ height: 24, width: 24 }}
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
                    <FolderOpenOutlinedIcon sx={{ fontSize: 17 }} />
                ) : (
                    <FolderOutlinedIcon sx={{ fontSize: 17 }} />
                )}
                <Typography sx={{ flexGrow: 1, fontSize: 14 }}>
                    {getQueueName(node)}
                </Typography>
                {selected && (
                    <IconButton size="small" sx={{ height: 26, width: 26 }}>
                        <MoreVertIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Box>
            {hasChildren && expanded && (
                <Box>
                    {node.children.map((child) => (
                        <QueueTreeItem
                            key={getQueueName(child)}
                            node={child}
                            level={level + 1}
                            expandedNodes={expandedNodes}
                            selectedName={selectedName}
                            onToggle={onToggle}
                            onSelect={onSelect}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

const QueueOverviewPanel = ({ queueMap, selectedQueue }) => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
    >
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1,
                boxShadow: "none",
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.25 }}>
                Basic Information
            </Typography>
            <DetailRow
                label="Path"
                value={buildPath(selectedQueue, queueMap)}
            />
            <DetailRow label="Priority" value="0" />
            <DetailRow
                label="Preemptable"
                value={String(selectedQueue?.spec?.reclaimable ?? true)}
            />
            <DetailRow
                label="Reclaimable"
                value={String(selectedQueue?.spec?.reclaimable ?? true)}
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
        </Paper>
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1,
                boxShadow: "none",
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.25 }}>
                Resource Usage
            </Typography>
            <ResourcePair
                title="Allocated"
                cpu={getAllocatedCpu(selectedQueue)}
                memory={getAllocatedMemory(selectedQueue)}
            />
            <ResourcePair
                title="Pending"
                cpu={getPendingCpu(selectedQueue)}
                memory={getPendingMemory(selectedQueue)}
            />
            <Box sx={{ display: "grid", gap: 1.1 }}>
                <Box
                    sx={{
                        alignItems: "center",
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: "64px 1fr",
                    }}
                >
                    <Typography sx={{ fontSize: 12 }}>CPU</Typography>
                    <UsageMeter
                        queue={selectedQueue}
                        resource={RESOURCE_COLUMNS[0]}
                    />
                </Box>
                <Box
                    sx={{
                        alignItems: "center",
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: "64px 1fr",
                    }}
                >
                    <Typography sx={{ fontSize: 12 }}>Memory</Typography>
                    <UsageMeter
                        queue={selectedQueue}
                        resource={RESOURCE_COLUMNS[1]}
                    />
                </Box>
            </Box>
        </Paper>
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1,
                boxShadow: "none",
                gridColumn: { md: "1 / -1" },
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.25 }}>
                Capacity
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                }}
            >
                <ResourcePair
                    title="Guarantee"
                    cpu={getGuaranteeCpu(selectedQueue)}
                    memory={getGuaranteeMemory(selectedQueue)}
                />
                <ResourcePair
                    title="Deserved"
                    cpu={getDeservedCpu(selectedQueue)}
                    memory={getDeservedMemory(selectedQueue)}
                />
                <ResourcePair
                    title="Capability"
                    cpu={getCapabilityCpu(selectedQueue)}
                    memory={getCapabilityMemory(selectedQueue)}
                />
            </Box>
        </Paper>
    </Box>
);

const QueueDetailsPanel = ({ selectedQueue, queueMap, onClose }) => {
    const [selectedTab, setSelectedTab] = useState("overview");
    const queueName = getQueueName(selectedQueue);
    const yamlQuery = useQuery({
        enabled: Boolean(selectedQueue && selectedTab === "yaml"),
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
                    label: "Status",
                    valueNode: selectedQueue ? (
                        <Chip
                            label={getStatus(selectedQueue)}
                            size="small"
                            sx={{
                                bgcolor: "#dbf5e4",
                                color: "#15803d",
                                fontSize: 11,
                                height: 20,
                            }}
                        />
                    ) : null,
                },
            ]}
            onClose={onClose}
            onTabChange={setSelectedTab}
            open={Boolean(selectedQueue)}
            tabs={[
                { label: "Overview", value: "overview" },
                { label: "YAML", value: "yaml" },
            ]}
            title={`Queue: ${queueName}`}
            renderTab={(tab) =>
                tab === "yaml" ? (
                    <YamlViewer
                        data={yamlQuery.data}
                        error={yamlQuery.error}
                        fill
                        isLoading={yamlQuery.isLoading || yamlQuery.isFetching}
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
            { blocked: 0, busy: 0, hot: 0, idle: 0, invalid: 0, normal: 0 },
        );
        const active = queues.filter((queue) => getStatus(queue) === "Active");

        return {
            active: active.length,
            activePercent: queues.length
                ? Math.round((active.length / queues.length) * 100)
                : 0,
            blocked: healthCounts.blocked || 0,
            hot: healthCounts.hot || 0,
            invalid: healthCounts.invalid || 0,
            starving: healthCounts.busy || 0,
            total: totalQueues || queues.length,
        };
    }, [queues, totalQueues]);

    const cards = [
        {
            label: "Total Queues",
            meta: `/ ${summary.total}`,
            value: queues.length,
        },
        {
            dot: "#16a34a",
            label: "Active Queues",
            meta: `${summary.activePercent}%`,
            value: summary.active,
        },
        {
            color: "#ef4444",
            label: "Hot Queues",
            value: summary.hot,
        },
        {
            color: "#f97316",
            label: "Starving Queues",
            value: summary.starving,
        },
        {
            color: "#5b4cc4",
            label: "Blocked Queues",
            value: summary.blocked,
        },
        {
            color: "#ef4444",
            label: "Invalid Queues",
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
                            alignItems: "baseline",
                            display: "flex",
                            gap: 1,
                        }}
                    >
                        <Typography
                            sx={{
                                color: card.color || "text.primary",
                                fontSize: 28,
                                fontWeight: 700,
                                letterSpacing: -0.5,
                            }}
                        >
                            {card.value}
                        </Typography>
                        {card.meta && (
                            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
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
                        bgcolor: "#e1e4e8",
                        borderRadius: 999,
                        height: 6,
                        mb: 1,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "#16a34a",
                            height: "100%",
                            left: 0,
                            position: "absolute",
                            width: "35%",
                        }}
                    />
                    <Box
                        sx={{
                            bgcolor: "#ff8a00",
                            height: "100%",
                            left: "35%",
                            position: "absolute",
                            width: "25%",
                        }}
                    />
                    <Box
                        sx={{
                            bgcolor: "#111827",
                            height: 12,
                            left: "75%",
                            position: "absolute",
                            top: -3,
                            width: 1,
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
                    <span>Borrowing</span>
                    <span>Limit (Capacity)</span>
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
                    ["#ef4444", "Hot: Usage > 80% or over Limit"],
                    ["#f97316", "Busy: 50% < Usage ≤ 80%"],
                    ["#16a34a", "Normal: Usage ≤ 50%"],
                    ["#9ca3af", "Idle: Usage = 0"],
                    ["#5b4cc4", "Blocked: constrained by parent"],
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
                        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
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
                    <Table size="small" sx={{ minWidth: 1380 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    rowSpan={2}
                                    sx={{
                                        bgcolor: "#ffffff",
                                        borderBottom: "1px solid #dfe3e8",
                                        fontWeight: 700,
                                        minWidth: 210,
                                    }}
                                >
                                    Queue
                                </TableCell>
                                <TableCell
                                    rowSpan={2}
                                    sx={{ fontWeight: 700, minWidth: 105 }}
                                >
                                    Status
                                </TableCell>
                                <TableCell
                                    rowSpan={2}
                                    sx={{ fontWeight: 700, minWidth: 70 }}
                                >
                                    Priority
                                </TableCell>
                                {RESOURCE_COLUMNS.map((resource) => (
                                    <TableCell
                                        align="center"
                                        colSpan={2}
                                        key={resource.key}
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {resource.label}
                                    </TableCell>
                                ))}
                                <TableCell
                                    rowSpan={2}
                                    sx={{ fontWeight: 700, minWidth: 130 }}
                                >
                                    Running Pods / Jobs
                                </TableCell>
                                <TableCell
                                    rowSpan={2}
                                    sx={{ fontWeight: 700, minWidth: 105 }}
                                >
                                    Pending Jobs
                                </TableCell>
                                <TableCell
                                    rowSpan={2}
                                    sx={{ fontWeight: 700, minWidth: 120 }}
                                >
                                    Health
                                </TableCell>
                                <TableCell rowSpan={2} />
                            </TableRow>
                            <TableRow>
                                {RESOURCE_COLUMNS.flatMap((resource) => [
                                    <TableCell
                                        key={`${resource.key}-usage`}
                                        sx={{
                                            bgcolor: "#ffffff",
                                            color: "text.secondary",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            minWidth: 170,
                                        }}
                                    >
                                        Usage
                                    </TableCell>,
                                    <TableCell
                                        key={`${resource.key}-values`}
                                        sx={{
                                            bgcolor: "#ffffff",
                                            color: "text.secondary",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            minWidth: 120,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        G / Used / Cap
                                    </TableCell>,
                                ])}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibleRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={13}>
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
                                    const statusActive =
                                        getStatus(node) === "Active";

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
                                            }}
                                        >
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        alignItems: "center",
                                                        display: "flex",
                                                        gap: 0.75,
                                                        pl: level * 2,
                                                    }}
                                                >
                                                    <IconButton
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            if (hasChildren)
                                                                handleToggle(
                                                                    queueName,
                                                                );
                                                        }}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            width: 24,
                                                        }}
                                                    >
                                                        {hasChildren ? (
                                                            expanded ? (
                                                                <ExpandMoreIcon
                                                                    sx={{
                                                                        fontSize: 15,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <ChevronRightIcon
                                                                    sx={{
                                                                        fontSize: 15,
                                                                    }}
                                                                />
                                                            )
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    width: 15,
                                                                }}
                                                            />
                                                        )}
                                                    </IconButton>
                                                    <Box
                                                        sx={{
                                                            borderLeft:
                                                                level > 0
                                                                    ? "1px dotted #cfd5dc"
                                                                    : "none",
                                                            height: 28,
                                                            ml:
                                                                level > 0
                                                                    ? -0.5
                                                                    : 0,
                                                        }}
                                                    />
                                                    {expanded && hasChildren ? (
                                                        <FolderOpenOutlinedIcon
                                                            sx={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    ) : (
                                                        <FolderOutlinedIcon
                                                            sx={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    )}
                                                    <Typography
                                                        sx={{
                                                            color: "#1677ff",
                                                            fontWeight: 700,
                                                            ...tableIdentifierSx,
                                                        }}
                                                    >
                                                        {queueName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
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
                                                                statusActive
                                                                    ? "#16a34a"
                                                                    : "#ef4444",
                                                            borderRadius: "50%",
                                                            height: 8,
                                                            width: 8,
                                                        }}
                                                    />
                                                    <Typography
                                                        sx={tableNumericSx}
                                                    >
                                                        {getStatus(node)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getPriority(node, level)}
                                            </TableCell>
                                            {RESOURCE_COLUMNS.flatMap(
                                                (resource) => {
                                                    const stats =
                                                        getResourceStats(
                                                            node,
                                                            resource,
                                                        );
                                                    return [
                                                        <TableCell
                                                            key={`${queueName}-${resource.key}-usage`}
                                                        >
                                                            <ResourceUsageBar
                                                                queue={node}
                                                                resource={
                                                                    resource
                                                                }
                                                            />
                                                        </TableCell>,
                                                        <TableCell
                                                            key={`${queueName}-${resource.key}-values`}
                                                            sx={
                                                                tableNumericSx
                                                            }
                                                        >
                                                            {
                                                                stats.guaranteeLabel
                                                            }{" "}
                                                            / {stats.usedLabel}{" "}
                                                            /{" "}
                                                            {
                                                                stats.capabilityLabel
                                                            }
                                                        </TableCell>,
                                                    ];
                                                },
                                            )}
                                            <TableCell sx={tableNumericSx}>
                                                {getRunningPodsJobs(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getPendingJobs(node)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={health.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor:
                                                            health.bgcolor,
                                                        border: `1px solid ${health.color}22`,
                                                        color: health.color,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        minWidth: 72,
                                                    }}
                                                />
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

    const queueMap = useMemo(() => {
        return new Map(queues.map((queue) => [getQueueName(queue), queue]));
    }, [queues]);

    const treeData = useMemo(() => buildQueueTree(queues), [queues]);

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
                    sx={{ fontSize: 24, fontWeight: 700, letterSpacing: 0.2 }}
                >
                    Queues
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
                        disabled
                        startIcon={<EditOutlinedIcon fontSize="small" />}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                    >
                        Edit Queue
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
                totalQueues={totalQueues}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                onSelectQueue={(queue) =>
                    setSelectedQueueName(getQueueName(queue))
                }
                onCloseQueueDetails={() => setSelectedQueueName("")}
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
