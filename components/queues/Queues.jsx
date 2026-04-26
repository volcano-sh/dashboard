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
                    <Typography sx={{ fontSize: 12 }}>Memory</Typography>
                    <UsageMeter
                        percent={getUsagePercent(selectedQueue, "memory")}
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
                                                            bgcolor: "#1db954",
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
                                                {level}
                                            </TableCell>
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
                                            <TableCell sx={tableNumericSx}>
                                                {getPendingCpu(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getPendingMemory(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getGuaranteeCpu(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getGuaranteeMemory(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getDeservedCpu(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getDeservedMemory(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getCapabilityCpu(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {getCapabilityMemory(node)}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {node.status?.running ||
                                                    "0 / 0"}
                                            </TableCell>
                                            <TableCell sx={tableNumericSx}>
                                                {node.status?.pendingJobs || 0}
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
