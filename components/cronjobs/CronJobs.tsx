"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Alert,
    Box,
    Button,
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
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import ResourceDetailDrawer from "../details/ResourceDetailDrawer";
import YamlViewer from "../details/YamlViewer";
import {
    DetailCard,
    DetailRow,
    EventsTable,
    MetadataChips,
} from "../details/DetailComponents";
import { tableIdentifierSx } from "../scheduling/tableDataStyles";
import {
    fetchCronJob,
    fetchCronJobEvents,
    fetchCronJobs,
    fetchCronJobYaml,
    fetchNamespaces,
    fetchQueues,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const activeCount = (cronJob) => {
    const active = cronJob?.status?.active;
    if (Array.isArray(active)) return active.length;
    return Number(active || 0);
};

const getStatus = (cronJob) => {
    if (cronJob?.summary?.status) return cronJob.summary.status;
    if (cronJob?.spec?.suspend) return "Suspended";
    if (activeCount(cronJob) > 0) return "Active";
    return "Scheduled";
};

const getQueue = (cronJob) =>
    cronJob?.summary?.queue ||
    cronJob?.spec?.queue ||
    cronJob?.metadata?.annotations?.["scheduling.volcano.sh/queue-name"] ||
    cronJob?.metadata?.labels?.queue ||
    "-";

const getName = (cronJob) => cronJob?.summary?.name || cronJob?.metadata?.name;

const getNamespace = (cronJob) =>
    cronJob?.summary?.namespace || cronJob?.metadata?.namespace;

const statusStyles = {
    Active: { bgcolor: "#e7f6ec", color: "#12833f" },
    Scheduled: { bgcolor: "#eef4ff", color: "#1d4ed8" },
    Suspended: { bgcolor: "#f2f3f5", color: "#69707a" },
};

const CronJobStatusChip = ({ status }) => {
    const sx = statusStyles[status] || statusStyles.Scheduled;
    return (
        <Chip
            label={status}
            size="small"
            sx={{
                bgcolor: sx.bgcolor,
                border: `1px solid ${sx.color}22`,
                color: sx.color,
                fontSize: 11,
                fontWeight: 700,
                minWidth: 86,
            }}
        />
    );
};

const CronJobOverview = ({ cronJob }) => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
    >
        <DetailCard title="Basic Information">
            <DetailRow label="Name" value={getName(cronJob)} />
            <DetailRow label="Namespace" value={getNamespace(cronJob)} />
            <DetailRow label="Queue" value={getQueue(cronJob)} />
            <DetailRow
                label="Schedule"
                value={cronJob?.summary?.schedule || cronJob?.spec?.schedule}
            />
            <DetailRow
                label="Created"
                value={formatDate(
                    cronJob?.summary?.createdAt ||
                        cronJob?.metadata?.creationTimestamp,
                )}
            />
            <DetailRow
                label="Labels"
                valueNode={<MetadataChips items={cronJob?.metadata?.labels} />}
            />
        </DetailCard>
        <DetailCard title="Execution Policy">
            <DetailRow
                label="Status"
                valueNode={<CronJobStatusChip status={getStatus(cronJob)} />}
            />
            <DetailRow
                label="Concurrency"
                value={
                    cronJob?.summary?.concurrencyPolicy ||
                    cronJob?.spec?.concurrencyPolicy ||
                    "Allow"
                }
            />
            <DetailRow
                label="Suspended"
                value={String(Boolean(cronJob?.spec?.suspend))}
            />
            <DetailRow
                label="Active Jobs"
                value={String(cronJob?.summary?.active ?? activeCount(cronJob))}
            />
            <DetailRow
                label="Last Schedule"
                value={formatDate(
                    cronJob?.summary?.lastScheduleTime ||
                        cronJob?.status?.lastScheduleTime,
                )}
            />
            <DetailRow
                label="Last Success"
                value={formatDate(
                    cronJob?.summary?.lastSuccessfulTime ||
                        cronJob?.status?.lastSuccessfulTime,
                )}
            />
        </DetailCard>
    </Box>
);

const CronJobDetailsDrawer = ({
    cronJob,
    onClose,
    selectedTab,
    setSelectedTab,
}) => {
    const namespace = getNamespace(cronJob);
    const name = getName(cronJob);
    const enabled = Boolean(namespace && name);

    const detailQuery = useQuery({
        enabled,
        initialData: cronJob || undefined,
        queryKey: ["cronjob", namespace, name],
        queryFn: () => fetchCronJob(namespace, name),
    });
    const yamlQuery = useQuery({
        enabled: enabled && selectedTab === "yaml",
        queryKey: ["cronjob-yaml", namespace, name],
        queryFn: () => fetchCronJobYaml(namespace, name),
    });
    const eventsQuery = useQuery({
        enabled: enabled && selectedTab === "events",
        queryKey: ["cronjob-events", namespace, name],
        queryFn: () => fetchCronJobEvents(namespace, name),
    });

    const detail = detailQuery.data || cronJob;

    return (
        <ResourceDetailDrawer
            activeTab={selectedTab}
            icon={<EventRepeatOutlinedIcon sx={{ fontSize: 18 }} />}
            meta={[
                { label: "Namespace", value: getNamespace(detail) },
                { label: "Queue", value: getQueue(detail) },
                {
                    label: "Status",
                    valueNode: detail ? (
                        <CronJobStatusChip status={getStatus(detail)} />
                    ) : null,
                },
            ]}
            onClose={onClose}
            onTabChange={setSelectedTab}
            open={Boolean(cronJob)}
            tabs={[
                { label: "Overview", value: "overview" },
                { label: "YAML", value: "yaml" },
                { label: "Events", value: "events" },
            ]}
            title={`CronJob: ${getName(detail) || "-"}`}
            renderTab={(tab) => {
                if (!detail) return null;
                if (detailQuery.isError) {
                    return (
                        <Alert severity="error">
                            {getApiErrorMessage(
                                detailQuery.error,
                                "Failed to load CronJob details",
                            )}
                        </Alert>
                    );
                }
                if (tab === "yaml") {
                    if (yamlQuery.isLoading) return <LinearProgress />;
                    if (yamlQuery.isError) {
                        return (
                            <Alert severity="error">
                                {getApiErrorMessage(
                                    yamlQuery.error,
                                    "Failed to load CronJob YAML",
                                )}
                            </Alert>
                        );
                    }
                    return <YamlViewer data={yamlQuery.data || ""} fill />;
                }
                if (tab === "events") {
                    if (eventsQuery.isLoading) return <LinearProgress />;
                    if (eventsQuery.isError) {
                        return (
                            <Alert severity="error">
                                {getApiErrorMessage(
                                    eventsQuery.error,
                                    "Failed to load CronJob events",
                                )}
                            </Alert>
                        );
                    }
                    return (
                        <EventsTable events={eventsQuery.data?.items || []} />
                    );
                }
                return <CronJobOverview cronJob={detail} />;
            }}
        />
    );
};

const CronJobs = () => {
    const [filters, setFilters] = useState({ namespace: "All", queue: "All" });
    const [searchText, setSearchText] = useState("");
    const [selectedCronJob, setSelectedCronJob] = useState(null);
    const [selectedTab, setSelectedTab] = useState("overview");

    const queryParams = useMemo(
        () => ({
            limit: 1000,
            namespace: filters.namespace,
            queue: filters.queue,
            search: searchText,
            sortBy: "metadata.creationTimestamp",
            sortOrder: "desc",
        }),
        [filters.namespace, filters.queue, searchText],
    );

    const cronJobsQuery = useQuery({
        queryKey: ["cronjobs", queryParams],
        queryFn: () => fetchCronJobs(queryParams),
    });
    const namespacesQuery = useQuery({
        queryKey: ["namespaces"],
        queryFn: fetchNamespaces,
    });
    const queuesQuery = useQuery({
        queryKey: ["queues-for-cronjobs"],
        queryFn: fetchQueues,
    });

    const cronJobs = cronJobsQuery.data?.items || [];
    const namespaces = namespacesQuery.data || ["All"];
    const queues = queuesQuery.data || ["All"];

    const filterFields = [
        {
            key: "namespace",
            label: "Namespace",
            onChange: (value) =>
                setFilters((previous) => ({ ...previous, namespace: value })),
            options: namespaces,
            type: "select",
            value: filters.namespace,
        },
        {
            key: "queue",
            label: "Queue",
            onChange: (value) =>
                setFilters((previous) => ({ ...previous, queue: value })),
            options: queues,
            type: "select",
            value: filters.queue,
        },
        {
            key: "search",
            label: "Search",
            onChange: setSearchText,
            placeholder: "Search name, label, queue...",
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
    ];

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography
                    component="h1"
                    sx={{ fontSize: 24, fontWeight: 600 }}
                >
                    CronJob
                </Typography>
                <Typography
                    color="text.secondary"
                    sx={{ fontSize: 13, mt: 0.5 }}
                >
                    Manage scheduled Volcano workloads and inspect their latest
                    scheduling activity.
                </Typography>
            </Box>

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
                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                        onClick={() => {
                            setFilters({ namespace: "All", queue: "All" });
                            setSearchText("");
                        }}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={() => cronJobsQuery.refetch()}
                        startIcon={<RefreshIcon fontSize="small" />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button
                        disabled
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{
                            bgcolor: "#ff4d2d",
                            textTransform: "none",
                            "&:hover": { bgcolor: "#e84325" },
                        }}
                        variant="contained"
                    >
                        Create CronJob
                    </Button>
                </Box>
            </Box>

            <LinearProgress
                sx={{
                    mb: 2,
                    visibility: cronJobsQuery.isFetching ? "visible" : "hidden",
                }}
            />
            {cronJobsQuery.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {getApiErrorMessage(
                        cronJobsQuery.error,
                        "Failed to load CronJobs",
                    )}
                </Alert>
            )}
            <Paper
                sx={{
                    border: "1px solid #dfe3e8",
                    borderRadius: 1.5,
                    boxShadow: "none",
                    overflow: "hidden",
                }}
            >
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {[
                                    "Name",
                                    "Namespace",
                                    "Queue",
                                    "Schedule",
                                    "Concurrency",
                                    "Last Schedule",
                                    "Status",
                                    "Actions",
                                ].map((label) => (
                                    <TableCell
                                        key={label}
                                        sx={{
                                            bgcolor: "#f7f8fa",
                                            color: "text.secondary",
                                            fontSize: 12,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cronJobs.map((cronJob) => (
                                <TableRow
                                    hover
                                    key={`${getNamespace(cronJob)}/${getName(cronJob)}`}
                                    onClick={() => {
                                        setSelectedCronJob(cronJob);
                                        setSelectedTab("overview");
                                    }}
                                    sx={{ cursor: "pointer", height: 58 }}
                                >
                                    <TableCell sx={tableIdentifierSx}>
                                        {getName(cronJob)}
                                    </TableCell>
                                    <TableCell>
                                        {getNamespace(cronJob)}
                                    </TableCell>
                                    <TableCell>{getQueue(cronJob)}</TableCell>
                                    <TableCell
                                        sx={{
                                            fontFamily:
                                                '"Roboto Mono", monospace',
                                            fontSize: 12,
                                        }}
                                    >
                                        {cronJob?.summary?.schedule ||
                                            cronJob?.spec?.schedule ||
                                            "-"}
                                    </TableCell>
                                    <TableCell>
                                        {cronJob?.summary?.concurrencyPolicy ||
                                            cronJob?.spec?.concurrencyPolicy ||
                                            "Allow"}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(
                                            cronJob?.summary
                                                ?.lastScheduleTime ||
                                                cronJob?.status
                                                    ?.lastScheduleTime,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <CronJobStatusChip
                                            status={getStatus(cronJob)}
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
                            ))}
                            {cronJobs.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        align="center"
                                        colSpan={8}
                                        sx={{ color: "text.secondary", py: 5 }}
                                    >
                                        No CronJobs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <CronJobDetailsDrawer
                cronJob={selectedCronJob}
                onClose={() => setSelectedCronJob(null)}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
            />
        </Box>
    );
};

export default CronJobs;
