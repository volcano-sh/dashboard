import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
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
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import {
    ChevronDown,
    ChevronRight,
    Edit3,
    Folder,
    FolderOpen,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Settings,
    X,
} from "lucide-react";
import CreateDialog from "../CreateDialog";
import QueueYamlDialog from "./QueueYamlDialog";
import QueuePagination from "./QueuePagination";
import { buildQueueTree } from "./utils/queueTreeBuilder";

const iconProps = { size: 18, strokeWidth: 1.8 };

const formatResource = (value, fallback = "0") => {
    if (value === undefined || value === null || value === "") return fallback;
    return String(value);
};

const getQueueName = (queue) => queue?.metadata?.name || "-";

const getParentName = (queue) => queue?.spec?.parent || "root";

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

const getWeight = (queue) => queue?.spec?.weight ?? "-";

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

const getUsagePercent = (queue, resource) => {
    const allocated =
        resource === "cpu" ? getAllocatedCpu(queue) : getAllocatedMemory(queue);
    const capability =
        resource === "cpu"
            ? getCapabilityCpu(queue)
            : getCapabilityMemory(queue);
    const used = parseNumber(allocated);
    const max = parseNumber(capability);
    if (!max) return 0;
    return Math.min(Math.round((used / max) * 100), 100);
};

const getUsageColor = (percent) => {
    if (percent >= 80) return "#ff3b30";
    if (percent >= 60) return "#ff9f0a";
    if (percent >= 40) return "#d4d900";
    return "#1db954";
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

const StatCard = ({ label, value }) => (
    <Box
        sx={{
            border: "1px solid #dfe3e8",
            borderRadius: 1,
            minHeight: 78,
            p: 1.5,
        }}
    >
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5 }}>
            {value}
        </Typography>
    </Box>
);

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

const UsageMeter = ({ percent }) => (
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
        <Typography sx={{ fontSize: 12, minWidth: 34 }}>{percent}%</Typography>
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
                            <ChevronDown size={15} />
                        ) : (
                            <ChevronRight size={15} />
                        )
                    ) : (
                        <Box sx={{ width: 15 }} />
                    )}
                </IconButton>
                {expanded && hasChildren ? (
                    <FolderOpen size={17} strokeWidth={1.8} />
                ) : (
                    <Folder size={17} strokeWidth={1.8} />
                )}
                <Typography sx={{ flexGrow: 1, fontSize: 14 }}>
                    {getQueueName(node)}
                </Typography>
                {selected && (
                    <IconButton size="small" sx={{ height: 26, width: 26 }}>
                        <MoreHorizontal size={16} />
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

const QueueDetailsPanel = ({ selectedQueue, queueMap, onClose }) => {
    if (!selectedQueue) {
        return (
            <Paper
                sx={{ border: "1px solid #dfe3e8", boxShadow: "none", p: 2 }}
            >
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                    Select a queue to view details.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1.5,
                boxShadow: "none",
                minHeight: 680,
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
                    Queue Details
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        disabled
                        size="small"
                        startIcon={<Edit3 size={15} />}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                    >
                        Edit
                    </Button>
                    <IconButton onClick={onClose} size="small">
                        <X {...iconProps} />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        alignItems: "center",
                        display: "flex",
                        gap: 1.5,
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            alignItems: "center",
                            bgcolor: "#f3f4f6",
                            borderRadius: "50%",
                            display: "flex",
                            height: 48,
                            justifyContent: "center",
                            width: 48,
                        }}
                    >
                        <Folder size={25} strokeWidth={1.8} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                            {getQueueName(selectedQueue)}
                        </Typography>
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
                    </Box>
                </Box>
                <DetailRow
                    label="Path"
                    value={buildPath(selectedQueue, queueMap)}
                />
                <DetailRow label="Priority" value="0" />
                <Divider sx={{ my: 1.5 }} />
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
                <Box sx={{ mb: 1.5 }}>
                    <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12, fontWeight: 700, mb: 1 }}
                    >
                        Resource Usage
                    </Typography>
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
                                percent={getUsagePercent(selectedQueue, "cpu")}
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
                            <Typography sx={{ fontSize: 12 }}>
                                Memory
                            </Typography>
                            <UsageMeter
                                percent={getUsagePercent(
                                    selectedQueue,
                                    "memory",
                                )}
                            />
                        </Box>
                    </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
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
                <Divider sx={{ my: 1.5 }} />
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
                    value={formatDate(
                        selectedQueue?.metadata?.creationTimestamp,
                    )}
                />
                <DetailRow
                    label="Updated At"
                    value={formatDate(
                        selectedQueue?.metadata?.managedFields?.[0]?.time ||
                            selectedQueue?.metadata?.creationTimestamp,
                    )}
                />
            </Box>
        </Paper>
    );
};

const QueueContentPanel = ({ selectedQueue, treeChildren, onOpenYaml }) => {
    const [tab, setTab] = useState(0);

    if (!selectedQueue) {
        return (
            <Paper
                sx={{ border: "1px solid #dfe3e8", boxShadow: "none", p: 2 }}
            >
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                    No queue selected.
                </Typography>
            </Paper>
        );
    }

    const cpuUsage = Number.parseFloat(getAllocatedCpu(selectedQueue)) || 0;
    const cpuMax = Number.parseFloat(getCapabilityCpu(selectedQueue)) || 0;
    const cpuPercent =
        cpuMax > 0 ? Math.min((cpuUsage / cpuMax) * 100, 100) : 0;
    const memoryPercent = 25;

    return (
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                boxShadow: "none",
                minHeight: 520,
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                    Queue: {getQueueName(selectedQueue)}
                </Typography>
            </Box>
            <Tabs
                value={tab}
                onChange={(event, value) => setTab(value)}
                sx={{
                    borderBottom: "1px solid #dfe3e8",
                    minHeight: 40,
                    px: 2,
                    "& .MuiTab-root": {
                        minHeight: 40,
                        textTransform: "none",
                    },
                }}
            >
                {["Overview", "Resource", "Settings", "Children"].map(
                    (label) => (
                        <Tab key={label} label={label} />
                    ),
                )}
            </Tabs>
            <Box sx={{ p: 2 }}>
                {tab === 0 && (
                    <>
                        <Typography
                            sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}
                        >
                            Summary
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "repeat(3, 1fr)",
                                },
                            }}
                        >
                            <StatCard
                                label="Status"
                                value={getStatus(selectedQueue)}
                            />
                            <StatCard
                                label="Allocated CPU"
                                value={getAllocatedCpu(selectedQueue)}
                            />
                            <StatCard
                                label="Allocated Memory"
                                value={getAllocatedMemory(selectedQueue)}
                            />
                            <StatCard
                                label="Pending CPU"
                                value={getPendingCpu(selectedQueue)}
                            />
                            <StatCard
                                label="Pending Memory"
                                value={getPendingMemory(selectedQueue)}
                            />
                            <StatCard
                                label="Max Resource"
                                value={`${getCapabilityCpu(selectedQueue)} CPU / ${getCapabilityMemory(selectedQueue)}`}
                            />
                        </Box>
                        <Divider sx={{ my: 2.5 }} />
                        <Typography
                            sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}
                        >
                            Resource Usage
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "1fr 1fr",
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    border: "1px solid #dfe3e8",
                                    borderRadius: 1,
                                    p: 2,
                                }}
                            >
                                <Typography
                                    sx={{ fontSize: 14, fontWeight: 700 }}
                                >
                                    CPU Usage
                                </Typography>
                                <LinearProgress
                                    value={cpuPercent}
                                    variant="determinate"
                                    sx={{ height: 8, my: 1.5 }}
                                />
                                <Typography
                                    align="center"
                                    sx={{ fontSize: 13 }}
                                >
                                    {getAllocatedCpu(selectedQueue)} /{" "}
                                    {getCapabilityCpu(selectedQueue)} CPU
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    border: "1px solid #dfe3e8",
                                    borderRadius: 1,
                                    p: 2,
                                }}
                            >
                                <Typography
                                    sx={{ fontSize: 14, fontWeight: 700 }}
                                >
                                    Memory Usage
                                </Typography>
                                <LinearProgress
                                    value={memoryPercent}
                                    variant="determinate"
                                    sx={{ height: 8, my: 1.5 }}
                                />
                                <Typography
                                    align="center"
                                    sx={{ fontSize: 13 }}
                                >
                                    {getAllocatedMemory(selectedQueue)} /{" "}
                                    {getCapabilityMemory(selectedQueue)}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                )}
                {tab === 1 && (
                    <TableContainer
                        sx={{ border: "1px solid #dfe3e8", borderRadius: 1 }}
                    >
                        <Table size="small">
                            <TableBody>
                                {[
                                    [
                                        "Allocated CPU",
                                        getAllocatedCpu(selectedQueue),
                                    ],
                                    [
                                        "Allocated Memory",
                                        getAllocatedMemory(selectedQueue),
                                    ],
                                    [
                                        "Pending CPU",
                                        getPendingCpu(selectedQueue),
                                    ],
                                    [
                                        "Pending Memory",
                                        getPendingMemory(selectedQueue),
                                    ],
                                    [
                                        "Guarantee CPU",
                                        getGuaranteeCpu(selectedQueue),
                                    ],
                                    [
                                        "Guarantee Memory",
                                        getGuaranteeMemory(selectedQueue),
                                    ],
                                    [
                                        "Capability CPU",
                                        getCapabilityCpu(selectedQueue),
                                    ],
                                    [
                                        "Capability Memory",
                                        getCapabilityMemory(selectedQueue),
                                    ],
                                ].map(([label, value]) => (
                                    <TableRow key={label}>
                                        <TableCell>{label}</TableCell>
                                        <TableCell>{value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {tab === 2 && (
                    <Box
                        sx={{
                            border: "1px solid #dfe3e8",
                            borderRadius: 1,
                            p: 2,
                        }}
                    >
                        <DetailRow
                            label="Weight"
                            value={getWeight(selectedQueue)}
                        />
                        <DetailRow
                            label="Parent"
                            value={selectedQueue?.spec?.parent || "-"}
                        />
                        <DetailRow
                            label="Reclaimable"
                            value={String(
                                selectedQueue?.spec?.reclaimable ?? true,
                            )}
                        />
                        <Button
                            onClick={() => onOpenYaml(selectedQueue)}
                            size="small"
                            sx={{ mt: 1, textTransform: "none" }}
                            variant="outlined"
                        >
                            View YAML
                        </Button>
                    </Box>
                )}
                {tab === 3 && (
                    <TableContainer
                        sx={{ border: "1px solid #dfe3e8", borderRadius: 1 }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Child Queue</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Weight</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {treeChildren.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            No child queues.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    treeChildren.map((child) => (
                                        <TableRow key={getQueueName(child)}>
                                            <TableCell>
                                                {getQueueName(child)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatus(child)}
                                            </TableCell>
                                            <TableCell>
                                                {getWeight(child)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Paper>
    );
};

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
                    xl: selectedQueue
                        ? "minmax(820px, 1fr) 360px"
                        : "minmax(820px, 1fr)",
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
                        <Settings size={17} strokeWidth={1.8} />
                    </IconButton>
                </Box>
                <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 1160 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    rowSpan={2}
                                    sx={{
                                        bgcolor: "#ffffff",
                                        borderBottom: "1px solid #dfe3e8",
                                        fontWeight: 700,
                                        minWidth: 190,
                                    }}
                                >
                                    Name
                                </TableCell>
                                <TableCell rowSpan={2} sx={{ fontWeight: 700 }}>
                                    Status
                                </TableCell>
                                <TableCell rowSpan={2} sx={{ fontWeight: 700 }}>
                                    Priority
                                </TableCell>
                                <TableCell
                                    align="center"
                                    colSpan={2}
                                    sx={{ fontWeight: 700 }}
                                >
                                    Resource Usage
                                </TableCell>
                                <TableCell
                                    align="center"
                                    colSpan={2}
                                    sx={{ fontWeight: 700 }}
                                >
                                    Pending
                                </TableCell>
                                <TableCell
                                    align="center"
                                    colSpan={2}
                                    sx={{ fontWeight: 700 }}
                                >
                                    Guarantee
                                </TableCell>
                                <TableCell
                                    align="center"
                                    colSpan={2}
                                    sx={{ fontWeight: 700 }}
                                >
                                    Deserved
                                </TableCell>
                                <TableCell
                                    align="center"
                                    colSpan={2}
                                    sx={{ fontWeight: 700 }}
                                >
                                    Capability
                                </TableCell>
                                <TableCell rowSpan={2} sx={{ fontWeight: 700 }}>
                                    Running Jobs / Pods
                                </TableCell>
                                <TableCell rowSpan={2} sx={{ fontWeight: 700 }}>
                                    Pending Jobs
                                </TableCell>
                                <TableCell rowSpan={2} />
                            </TableRow>
                            <TableRow>
                                {[
                                    "CPU",
                                    "Memory",
                                    "CPU",
                                    "Memory",
                                    "CPU",
                                    "Memory",
                                    "CPU",
                                    "Memory",
                                    "CPU",
                                    "Memory",
                                ].map((heading, index) => (
                                    <TableCell
                                        key={`${heading}-${index}`}
                                        sx={{
                                            bgcolor: "#ffffff",
                                            color: "text.secondary",
                                            fontSize: 12,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {heading}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibleRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={16}>
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
                                                                <ChevronDown
                                                                    size={15}
                                                                />
                                                            ) : (
                                                                <ChevronRight
                                                                    size={15}
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
                                                    {expanded && hasChildren ? (
                                                        <FolderOpen
                                                            size={16}
                                                            strokeWidth={1.8}
                                                        />
                                                    ) : (
                                                        <Folder
                                                            size={16}
                                                            strokeWidth={1.8}
                                                        />
                                                    )}
                                                    <Typography
                                                        sx={{
                                                            color: "#1677ff",
                                                            fontSize: 13,
                                                            fontWeight: 700,
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
                                                            bgcolor: "#1db954",
                                                            borderRadius: "50%",
                                                            height: 8,
                                                            width: 8,
                                                        }}
                                                    />
                                                    <Typography
                                                        sx={{ fontSize: 12 }}
                                                    >
                                                        {getStatus(node)}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{level}</TableCell>
                                            <TableCell>
                                                <UsageMeter
                                                    percent={getUsagePercent(
                                                        node,
                                                        "cpu",
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <UsageMeter
                                                    percent={getUsagePercent(
                                                        node,
                                                        "memory",
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {getPendingCpu(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getPendingMemory(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getGuaranteeCpu(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getGuaranteeMemory(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getDeservedCpu(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getDeservedMemory(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getCapabilityCpu(node)}
                                            </TableCell>
                                            <TableCell>
                                                {getCapabilityMemory(node)}
                                            </TableCell>
                                            <TableCell>
                                                {node.status?.running ||
                                                    "0 / 0"}
                                            </TableCell>
                                            <TableCell>
                                                {node.status?.pendingJobs || 0}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small">
                                                    <MoreVertical size={16} />
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
            {selectedQueue && (
                <Box
                    sx={{
                        animation: "queueDetailSlideIn 180ms ease-out",
                        "@keyframes queueDetailSlideIn": {
                            from: {
                                opacity: 0,
                                transform: "translateX(24px)",
                            },
                            to: {
                                opacity: 1,
                                transform: "translateX(0)",
                            },
                        },
                    }}
                >
                    <QueueDetailsPanel
                        onClose={onCloseQueueDetails}
                        selectedQueue={selectedQueue}
                        queueMap={queueMap}
                    />
                </Box>
            )}
        </Box>
    );
};

const QueueListView = ({
    queues,
    pagination,
    totalQueues,
    onPageChange,
    onRowsPerPageChange,
    onOpenYaml,
}) => (
    <>
        <TableContainer
            component={Paper}
            sx={{ border: "1px solid #dfe3e8", boxShadow: "none" }}
        >
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {[
                            "Queue",
                            "Parent",
                            "Status",
                            "Weight",
                            "Allocated CPU",
                            "Allocated Memory",
                            "Capability",
                            "Reclaimable",
                            "Created At",
                            "Actions",
                        ].map((heading) => (
                            <TableCell
                                key={heading}
                                sx={{ bgcolor: "#f7f7f7", fontWeight: 700 }}
                            >
                                {heading}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {queues.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10}>No queues found.</TableCell>
                        </TableRow>
                    ) : (
                        queues.map((queue) => (
                            <TableRow hover key={getQueueName(queue)}>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {getQueueName(queue)}
                                </TableCell>
                                <TableCell>{getParentName(queue)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={getStatus(queue)}
                                        size="small"
                                        sx={{ bgcolor: "#eef0f2" }}
                                    />
                                </TableCell>
                                <TableCell>{getWeight(queue)}</TableCell>
                                <TableCell>{getAllocatedCpu(queue)}</TableCell>
                                <TableCell>
                                    {getAllocatedMemory(queue)}
                                </TableCell>
                                <TableCell>
                                    {getCapabilityCpu(queue)} CPU /{" "}
                                    {getCapabilityMemory(queue)}
                                </TableCell>
                                <TableCell>
                                    {String(queue?.spec?.reclaimable ?? true)}
                                </TableCell>
                                <TableCell>
                                    {formatDate(
                                        queue?.metadata?.creationTimestamp,
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => onOpenYaml(queue)}
                                        size="small"
                                        sx={{ textTransform: "none" }}
                                    >
                                        YAML
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
        <QueuePagination
            pagination={pagination}
            totalQueues={totalQueues}
            handleChangeRowsPerPage={onRowsPerPageChange}
            handleChangePage={onPageChange}
        />
    </>
);

const Queues = () => {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [selectedQueueYaml, setSelectedQueueYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 });
    const [totalQueues, setTotalQueues] = useState(0);

    const fetchQueues = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                search: searchText,
                state: "All",
                page: pagination.page,
                limit: pagination.rowsPerPage,
            };

            const response = await axios.get("/api/queues", { params });
            setQueues(response.data.items || []);
            setTotalQueues(response.data.totalCount || 0);
        } catch (err) {
            setError("Failed to fetch queues: " + err.message);
            setQueues([]);
            setTotalQueues(0);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.rowsPerPage, searchText]);

    useEffect(() => {
        fetchQueues();
    }, [fetchQueues]);

    const queueMap = useMemo(() => {
        return new Map(queues.map((queue) => [getQueueName(queue), queue]));
    }, [queues]);

    const treeData = useMemo(() => buildQueueTree(queues), [queues]);

    const treeNodeMap = useMemo(() => {
        const map = new Map();
        const visit = (nodes) => {
            nodes.forEach((node) => {
                map.set(getQueueName(node), node);
                if (node.children?.length) visit(node.children);
            });
        };
        visit(treeData);
        return map;
    }, [treeData]);

    const selectedQueue = useMemo(() => {
        if (selectedQueueName && queueMap.has(selectedQueueName)) {
            return queueMap.get(selectedQueueName);
        }
        return null;
    }, [queueMap, selectedQueueName]);

    const handleCreateQueue = async (newQueue) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/queues", newQueue);

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

    const handleOpenYaml = useCallback(async (queue) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/queue/${getQueueName(queue)}/yaml`,
                { responseType: "text" },
            );
            const formattedYaml = response.data
                .split("\n")
                .map((line) => {
                    const keyMatch = line.match(/^(\s*)([^:\s]+):/);
                    if (keyMatch) {
                        const [, indent, key] = keyMatch;
                        const value = line.slice(keyMatch[0].length);
                        return `${indent}<span class="yaml-key">${key}</span>:${value}`;
                    }
                    return line;
                })
                .join("\n");

            setSelectedQueueName(getQueueName(queue));
            setSelectedQueueYaml(formattedYaml);
            setOpenDialog(true);
        } catch (err) {
            setError("Failed to fetch queue YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((previous) => ({ ...previous, page: 1 }));
    };

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
                    alignItems: { xs: "stretch", md: "center" },
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 1.5,
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Box sx={{ alignItems: "center", display: "flex", gap: 2 }}>
                    <TextField
                        onChange={handleSearch}
                        placeholder="Search queues..."
                        size="small"
                        value={searchText}
                        sx={{ minWidth: 260 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                    <Button
                        disabled={loading}
                        onClick={fetchQueues}
                        startIcon={<RefreshCw size={17} />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button
                        disabled
                        startIcon={<Edit3 size={16} />}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                    >
                        Edit Queue
                    </Button>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        startIcon={<Plus size={16} />}
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
            <QueueYamlDialog
                openDialog={openDialog}
                handleCloseDialog={() => setOpenDialog(false)}
                selectedQueueName={selectedQueueName}
                selectedQueueYaml={selectedQueueYaml}
            />
        </Box>
    );
};

export default Queues;
