"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Alert,
    Box,
    Button,
    IconButton,
    InputAdornment,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SchedulingTableHeader from "../scheduling/SchedulingTableHeader";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import SchedulingTableSurface from "../scheduling/SchedulingTableSurface";
import SchedulingStatusChip from "../scheduling/SchedulingStatusChip";
import ResourceDetailDrawer from "../details/ResourceDetailDrawer";
import YamlViewer from "../details/YamlViewer";
import {
    DetailCard,
    DetailRow,
    MetadataChips,
} from "../details/DetailComponents";
import ResourceEventsPanel from "../details/ResourceEventsPanel";
import { useAuth } from "../auth/AuthProvider";
import {
    tableIdentifierSx,
    tableNameSx,
    tableTimestampSx,
} from "../scheduling/tableDataStyles";
import {
    createCronJob,
    fetchCronJob,
    fetchCronJobEvents,
    fetchCronJobs,
    fetchCronJobYaml,
    fetchQueues,
    getApiErrorMessage,
    updateCronJobYaml,
} from "../../lib/client/dashboard-api";
import CreateJobDialog from "../jobs/JobTable/CreateJobDialog";

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

const CronJobStatusChip = ({ status }) => (
    <SchedulingStatusChip minWidth={86} size="medium" status={status} />
);

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
    canWrite = true,
    cronJob,
    onClose,
    selectedTab,
    setSelectedTab,
}) => {
    const queryClient = useQueryClient();
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
                    return (
                        <YamlViewer
                            data={yamlQuery.data || ""}
                            editable={canWrite}
                            fill
                            onSubmit={async (manifest) => {
                                await updateCronJobYaml(
                                    namespace,
                                    name,
                                    manifest,
                                );
                                await Promise.all([
                                    queryClient.invalidateQueries({
                                        queryKey: ["cronjobs"],
                                    }),
                                    queryClient.invalidateQueries({
                                        queryKey: ["cronjob", namespace, name],
                                    }),
                                    queryClient.invalidateQueries({
                                        queryKey: [
                                            "cronjob-yaml",
                                            namespace,
                                            name,
                                        ],
                                    }),
                                ]);
                            }}
                        />
                    );
                }
                if (tab === "events") {
                    return (
                        <ResourceEventsPanel
                            emptyText="No CronJob events available."
                            errorMessage="Failed to load CronJob events"
                            queryFn={() => fetchCronJobEvents(namespace, name)}
                            queryKey={["cronjob-events", namespace, name]}
                        />
                    );
                }
                return <CronJobOverview cronJob={detail} />;
            }}
        />
    );
};

const CronJobs = () => {
    const auth = useAuth();
    const canWrite = auth?.canWrite !== false;
    const [filters, setFilters] = useState({
        namespace: "All",
        queue: "All",
        status: "All",
    });
    const [searchText, setSearchText] = useState("");
    const [sortDirection, setSortDirection] = useState("desc");
    const [anchorEl, setAnchorEl] = useState({
        namespace: null,
        queue: null,
        status: null,
    });
    const [selectedCronJob, setSelectedCronJob] = useState(null);
    const [selectedTab, setSelectedTab] = useState("overview");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const queryParams = useMemo(
        () => ({
            limit: 1000,
            namespace: filters.namespace,
            queue: filters.queue,
            search: searchText,
            status: filters.status,
            sortBy: "summary.lastScheduleTime",
            sortOrder: sortDirection,
        }),
        [
            filters.namespace,
            filters.queue,
            filters.status,
            searchText,
            sortDirection,
        ],
    );

    const cronJobsQuery = useQuery({
        queryKey: ["cronjobs", queryParams],
        queryFn: () => fetchCronJobs(queryParams),
    });
    const queuesQuery = useQuery({
        queryKey: ["queues-for-cronjobs"],
        queryFn: fetchQueues,
    });

    const cronJobs = useMemo(
        () => cronJobsQuery.data?.items || [],
        [cronJobsQuery.data],
    );
    const namespaces = useMemo(
        () => cronJobsQuery.data?.facets?.namespaces || ["All"],
        [cronJobsQuery.data],
    );
    const queues = queuesQuery.data || ["All"];
    const uniqueStatuses = useMemo(
        () => ["All", ...new Set(cronJobs.map(getStatus).filter(Boolean))],
        [cronJobs],
    );
    const handleFilterChange = useCallback((key, value) => {
        setFilters((previous) => ({ ...previous, [key]: value }));
    }, []);
    const handleHeaderFilterOpen = useCallback((key, event) => {
        setAnchorEl((previous) => ({
            ...previous,
            [key]: event.currentTarget,
        }));
    }, []);
    const handleHeaderFilterSelect = useCallback(
        (key, value) => {
            handleFilterChange(key, value);
            setAnchorEl((previous) => ({ ...previous, [key]: null }));
        },
        [handleFilterChange],
    );
    const toggleSortDirection = useCallback(() => {
        setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
    }, []);
    const handleCreateCronJob = useCallback(
        async (newCronJob) => {
            try {
                await createCronJob(newCronJob);
                alert("CronJob created successfully!");
                setCreateDialogOpen(false);
                await queryClient.invalidateQueries({
                    queryKey: ["cronjobs"],
                });
            } catch (error) {
                alert(getApiErrorMessage(error, "Error creating CronJob"));
            }
        },
        [queryClient],
    );
    const filterColumn = useCallback(
        (key, options) => ({
            anchorEl: anchorEl[key],
            onOpen: (event) => handleHeaderFilterOpen(key, event),
            onSelect: (value) => handleHeaderFilterSelect(key, value),
            options,
            value: filters[key],
        }),
        [anchorEl, filters, handleHeaderFilterOpen, handleHeaderFilterSelect],
    );

    const filterFields = [
        {
            key: "namespace",
            label: "Namespace",
            onChange: (value) => handleFilterChange("namespace", value),
            options: namespaces,
            type: "select",
            value: filters.namespace,
        },
        {
            key: "queue",
            label: "Queue",
            onChange: (value) => handleFilterChange("queue", value),
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
                            setFilters({
                                namespace: "All",
                                queue: "All",
                                status: "All",
                            });
                            setAnchorEl({
                                namespace: null,
                                queue: null,
                                status: null,
                            });
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
                    {canWrite && (
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
                            Create CronJob
                        </Button>
                    )}
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
            <SchedulingTableSurface>
                <Table size="small" stickyHeader>
                    <SchedulingTableHeader
                        columns={[
                            { key: "name", label: "Name", minWidth: 180 },
                            {
                                filter: filterColumn("namespace", namespaces),
                                key: "namespace",
                                label: "Namespace",
                                minWidth: 150,
                            },
                            {
                                filter: filterColumn("queue", queues),
                                key: "queue",
                                label: "Queue",
                                minWidth: 150,
                            },
                            {
                                key: "schedule",
                                label: "Schedule",
                                minWidth: 140,
                            },
                            {
                                key: "concurrency",
                                label: "Concurrency",
                                minWidth: 130,
                            },
                            {
                                key: "lastSchedule",
                                label: "Last Schedule",
                                minWidth: 180,
                                onSort: toggleSortDirection,
                                sortable: true,
                                sortDirection,
                            },
                            {
                                filter: filterColumn("status", uniqueStatuses),
                                key: "status",
                                label: "Status",
                                minWidth: 130,
                            },
                            ...(canWrite
                                ? [
                                      {
                                          key: "actions",
                                          label: "Actions",
                                          minWidth: 90,
                                      },
                                  ]
                                : []),
                        ]}
                    />
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
                                <TableCell sx={tableNameSx}>
                                    {getName(cronJob)}
                                </TableCell>
                                <TableCell sx={tableIdentifierSx}>
                                    {getNamespace(cronJob)}
                                </TableCell>
                                <TableCell sx={tableIdentifierSx}>
                                    {getQueue(cronJob)}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        ...tableTimestampSx,
                                    }}
                                >
                                    {cronJob?.summary?.schedule ||
                                        cronJob?.spec?.schedule ||
                                        "-"}
                                </TableCell>
                                <TableCell sx={tableIdentifierSx}>
                                    {cronJob?.summary?.concurrencyPolicy ||
                                        cronJob?.spec?.concurrencyPolicy ||
                                        "Allow"}
                                </TableCell>
                                <TableCell sx={tableTimestampSx}>
                                    {formatDate(
                                        cronJob?.summary?.lastScheduleTime ||
                                            cronJob?.status?.lastScheduleTime,
                                    )}
                                </TableCell>
                                <TableCell>
                                    <CronJobStatusChip
                                        status={getStatus(cronJob)}
                                    />
                                </TableCell>
                                {canWrite && (
                                    <TableCell>
                                        <IconButton size="small">
                                            <MoreVertIcon
                                                sx={{ fontSize: 16 }}
                                            />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {cronJobs.length === 0 && (
                            <TableRow>
                                <TableCell
                                    align="center"
                                    colSpan={canWrite ? 8 : 7}
                                    sx={{ color: "text.secondary", py: 5 }}
                                >
                                    No CronJobs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </SchedulingTableSurface>

            <CronJobDetailsDrawer
                canWrite={canWrite}
                cronJob={selectedCronJob}
                onClose={() => setSelectedCronJob(null)}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
            />
            {canWrite && (
                <CreateJobDialog
                    open={createDialogOpen}
                    onClose={() => setCreateDialogOpen(false)}
                    onCreate={handleCreateCronJob}
                    resourceNameLabel="CronJob Name"
                    resourceType="CronJob"
                    title="Create a CronJob"
                />
            )}
        </Box>
    );
};

export default CronJobs;
