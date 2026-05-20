import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    InputAdornment,
    LinearProgress,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createPodGroup,
    fetchQueues,
    fetchPodGroup,
    fetchPodGroupEvents,
    fetchPodGroupYaml,
    fetchPodGroups,
    getApiErrorMessage,
    updatePodGroupYaml,
} from "../../lib/client/dashboard-api";
import PodGroupsTable from "./PodGroupsTable/PodGroupsTable";
import JobPagination from "../jobs/JobPagination"; // Reuse pagination
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";
import ResourceDetailDrawer from "../details/ResourceDetailDrawer";
import YamlViewer from "../details/YamlViewer";
import {
    DetailCard,
    DetailRow,
    MetadataChips,
} from "../details/DetailComponents";
import ResourceEventsPanel from "../details/ResourceEventsPanel";
import JobStatusChip from "../jobs/JobStatusChip";
import { useAuth } from "../auth/AuthProvider";
import CreateJobDialog from "../jobs/JobTable/CreateJobDialog";
import ReadOnlyActionTooltip from "../access/ReadOnlyActionTooltip";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const PodGroupOverview = ({ podGroup }) => (
    <Stack spacing={2}>
        <Box
            sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
        >
            <DetailCard title="Basic Information">
                <DetailRow label="Name" value={podGroup?.metadata?.name} />
                <DetailRow
                    label="Namespace"
                    value={podGroup?.metadata?.namespace}
                />
                <DetailRow label="Queue" value={podGroup?.spec?.queue} />
                <DetailRow
                    label="Created"
                    value={formatDate(podGroup?.metadata?.creationTimestamp)}
                />
                <DetailRow
                    label="Labels"
                    valueNode={
                        <MetadataChips items={podGroup?.metadata?.labels} />
                    }
                />
            </DetailCard>
            <DetailCard title="Scheduling">
                <DetailRow
                    label="Min Member"
                    value={String(podGroup?.spec?.minMember ?? "-")}
                />
                <DetailRow
                    label="Priority Class"
                    value={podGroup?.spec?.priorityClassName}
                />
                <DetailRow
                    label="Phase"
                    valueNode={
                        <JobStatusChip
                            status={
                                podGroup?.summary?.status ||
                                podGroup?.status?.phase ||
                                "Unknown"
                            }
                        />
                    }
                />
            </DetailCard>
        </Box>
        <DetailCard title="Resources">
            <DetailRow
                label="Min Resources"
                value={
                    podGroup?.spec?.minResources
                        ? JSON.stringify(podGroup.spec.minResources)
                        : "-"
                }
            />
            <DetailRow
                label="Running"
                value={String(podGroup?.status?.running ?? "-")}
            />
            <DetailRow
                label="Succeeded"
                value={String(podGroup?.status?.succeeded ?? "-")}
            />
            <DetailRow
                label="Failed"
                value={String(podGroup?.status?.failed ?? "-")}
            />
        </DetailCard>
    </Stack>
);

const PodGroupDetailsDrawer = ({
    canWrite = true,
    onClose,
    podGroup,
    selectedTab,
    setSelectedTab,
}) => {
    const queryClient = useQueryClient();
    const namespace = podGroup?.metadata?.namespace;
    const name = podGroup?.metadata?.name;
    const {
        data: detail,
        error,
        isLoading,
    } = useQuery({
        enabled: Boolean(namespace && name),
        initialData: podGroup || undefined,
        queryFn: () => fetchPodGroup(namespace, name),
        queryKey: ["podgroup", namespace, name],
    });
    const yamlQuery = useQuery({
        enabled: Boolean(namespace && name && selectedTab === "yaml"),
        queryFn: () => fetchPodGroupYaml(namespace, name),
        queryKey: ["podGroupYaml", namespace, name],
    });
    const podGroupData = detail || podGroup;

    return (
        <ResourceDetailDrawer
            activeTab={selectedTab}
            icon={<AccountTreeOutlinedIcon sx={{ fontSize: 18 }} />}
            meta={[
                { label: "Namespace", value: namespace },
                { label: "Queue", value: podGroupData?.spec?.queue },
                {
                    label: "Status",
                    valueNode: (
                        <JobStatusChip
                            status={
                                podGroupData?.summary?.status ||
                                podGroupData?.status?.phase ||
                                "Unknown"
                            }
                        />
                    ),
                },
            ]}
            onClose={onClose}
            onTabChange={setSelectedTab}
            open={Boolean(podGroup)}
            tabs={[
                { label: "Overview", value: "overview" },
                { label: "YAML", value: "yaml" },
                { label: "Events", value: "events" },
            ]}
            title={`PodGroup: ${name || "-"}`}
            renderTab={(tab) => {
                if (isLoading && !podGroupData) {
                    return (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 6,
                            }}
                        >
                            <CircularProgress size={22} />
                        </Box>
                    );
                }
                if (error) {
                    return (
                        <Alert severity="error" sx={{ boxShadow: "none" }}>
                            {getApiErrorMessage(
                                error,
                                "Failed to fetch podgroup",
                            )}
                        </Alert>
                    );
                }
                if (tab === "yaml") {
                    return (
                        <YamlViewer
                            data={yamlQuery.data}
                            editable={canWrite}
                            error={yamlQuery.error}
                            fill
                            isLoading={
                                yamlQuery.isLoading || yamlQuery.isFetching
                            }
                            onSubmit={async (manifest) => {
                                await updatePodGroupYaml(
                                    namespace,
                                    name,
                                    manifest,
                                );
                                await Promise.all([
                                    queryClient.invalidateQueries({
                                        queryKey: ["podgroups"],
                                    }),
                                    queryClient.invalidateQueries({
                                        queryKey: ["podgroup", namespace, name],
                                    }),
                                    queryClient.invalidateQueries({
                                        queryKey: [
                                            "podGroupYaml",
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
                            emptyText="No PodGroup events available."
                            errorMessage="Failed to fetch PodGroup events"
                            queryFn={() => fetchPodGroupEvents(namespace, name)}
                            queryKey={["podGroupEvents", namespace, name]}
                        />
                    );
                }
                return <PodGroupOverview podGroup={podGroupData} />;
            }}
        />
    );
};

const PodGroups = () => {
    const auth = useAuth();
    const canWrite = auth?.canWrite !== false;
    const isReadOnly = !canWrite;
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "All",
        queue: "All",
    });
    const [selectedPodGroup, setSelectedPodGroup] = useState(null);
    const [selectedTab, setSelectedTab] = useState("overview");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
        queue: null,
    });
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [sortDirection, setSortDirection] = useState("desc");
    const [actionError, setActionError] = useState(null);
    const queryClient = useQueryClient();

    const podGroupParams = {
        search: searchText,
        namespace: filters.namespace,
        queue: filters.queue,
        status: filters.status,
        page: pagination.page,
        limit: pagination.rowsPerPage,
        sortBy: "metadata.creationTimestamp",
        sortOrder: sortDirection,
    };

    const {
        data: podGroupsData,
        error: podGroupsError,
        isFetching: podGroupsFetching,
        isLoading: podGroupsLoading,
        refetch: refetchPodGroups,
    } = useQuery({
        queryKey: [
            "podgroups",
            searchText,
            filters.namespace,
            filters.queue,
            filters.status,
            pagination.page,
            pagination.rowsPerPage,
            sortDirection,
        ],
        queryFn: () => fetchPodGroups(podGroupParams),
    });

    const { data: allQueues = [] } = useQuery({
        queryKey: ["queues", "all"],
        queryFn: fetchQueues,
    });

    const podGroups = useMemo(
        () => podGroupsData?.items || [],
        [podGroupsData],
    );
    const allNamespaces = useMemo(
        () => podGroupsData?.facets?.namespaces || ["All"],
        [podGroupsData],
    );
    const totalItems = podGroupsData?.totalCount || 0;
    const loading = podGroupsLoading || podGroupsFetching;
    const error = podGroupsError
        ? getApiErrorMessage(podGroupsError, "Failed to fetch podgroups")
        : actionError;

    const handleSearch = useCallback((event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const handleResetFilters = useCallback(() => {
        setSearchText("");
        setFilters({
            status: "All",
            namespace: "All",
            queue: "All",
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
        setAnchorEl({
            status: null,
            namespace: null,
            queue: null,
        });
    }, []);

    const handleClick = useCallback((pg) => {
        setActionError(null);
        setSelectedPodGroup(pg);
        setSelectedTab("overview");
    }, []);

    const handleChangePage = useCallback((event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setPagination((prev) => ({
            ...prev,
            rowsPerPage: parseInt(event.target.value, 10),
            page: 1,
        }));
    }, []);

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const uniqueStatuses = useMemo(() => {
        return [
            "All",
            ...new Set(
                podGroups
                    .map((pg) => pg.summary?.status || pg.status?.phase)
                    .filter(Boolean),
            ),
        ];
    }, [podGroups]);

    const handleFilterValueChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const filterFields = useMemo(
        () => [
            {
                key: "namespace",
                label: "Namespace",
                onChange: (value) =>
                    handleFilterValueChange("namespace", value),
                options: allNamespaces,
                type: "select",
                value: filters.namespace,
            },
            {
                key: "queue",
                label: "Queue",
                onChange: (value) => handleFilterValueChange("queue", value),
                options: allQueues,
                type: "select",
                value: filters.queue,
            },
            {
                key: "search",
                label: "Search",
                onChange: (value) => handleSearch({ target: { value } }),
                placeholder: "Search name, label, queue...",
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
        [
            allNamespaces,
            allQueues,
            filters.namespace,
            filters.queue,
            handleFilterValueChange,
            handleSearch,
            searchText,
        ],
    );

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const handleCreatePodGroup = useCallback(
        async (newPodGroup) => {
            try {
                await createPodGroup(newPodGroup);
                alert("PodGroup created successfully!");
                setCreateDialogOpen(false);
                await queryClient.invalidateQueries({
                    queryKey: ["podgroups"],
                });
            } catch (error) {
                alert(getApiErrorMessage(error, "Error creating PodGroup"));
            }
        },
        [queryClient],
    );

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography
                    component="h1"
                    sx={{ fontSize: 24, fontWeight: 700 }}
                >
                    Pod Groups
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
                        <Typography
                            color={theme.palette.error.main}
                            sx={{ fontSize: 14 }}
                        >
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
                        onClick={() => refetchPodGroups()}
                        startIcon={<RefreshIcon fontSize="small" />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <ReadOnlyActionTooltip readOnly={isReadOnly}>
                        <Button
                            disabled={isReadOnly}
                            onClick={() => setCreateDialogOpen(true)}
                            startIcon={<AddIcon fontSize="small" />}
                            sx={{
                                bgcolor: "#ff4d2d",
                                textTransform: "none",
                                "&:hover": { bgcolor: "#e84325" },
                            }}
                            variant="contained"
                        >
                            Create PodGroup
                        </Button>
                    </ReadOnlyActionTooltip>
                </Box>
            </Box>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <PodGroupsTable
                podGroups={podGroups}
                handlePodGroupClick={handleClick}
                filters={filters}
                uniqueStatuses={uniqueStatuses}
                allNamespaces={allNamespaces}
                allQueues={allQueues}
                anchorEl={anchorEl}
                handleFilterClick={handleFilterClick}
                handleFilterClose={handleFilterClose}
                sortDirection={sortDirection}
                toggleSortDirection={toggleSortDirection}
            />
            <JobPagination
                pagination={pagination}
                totalJobs={totalItems} // Prop name in JobPagination is totalJobs
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
            <PodGroupDetailsDrawer
                canWrite={canWrite}
                onClose={() => setSelectedPodGroup(null)}
                podGroup={selectedPodGroup}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
            />
            {!isReadOnly && (
                <CreateJobDialog
                    open={createDialogOpen}
                    onClose={() => setCreateDialogOpen(false)}
                    onCreate={handleCreatePodGroup}
                    resourceNameLabel="PodGroup Name"
                    resourceType="PodGroup"
                    title="Create a PodGroup"
                />
            )}
        </Box>
    );
};

export default PodGroups;
