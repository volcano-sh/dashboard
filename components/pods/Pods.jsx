import React, { useCallback, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    InputAdornment,
    LinearProgress,
    Typography,
    useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateDialog from "../CreateDialog";
import {
    createPod,
    fetchNamespaces,
    fetchQueues,
    fetchPodYaml,
    fetchPods,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import PodsTable from "./PodsTable/PodsTable";
import PodsPagination from "./PodsPagination";
import PodDetailsDialog from "./PodDetailsDialog";
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";

const Pods = () => {
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "All",
        queue: "All",
    });
    const [selectedPodYaml, setSelectedPodYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedPodName, setSelectedPodName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [sortDirection, setSortDirection] = useState("desc");
    const [actionError, setActionError] = useState(null);
    const queryClient = useQueryClient();

    const podParams = {
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
        data: podsData,
        error: podsError,
        isFetching: podsFetching,
        isLoading: podsLoading,
    } = useQuery({
        queryKey: [
            "pods",
            searchText,
            filters.namespace,
            filters.queue,
            filters.status,
            pagination.page,
            pagination.rowsPerPage,
            sortDirection,
        ],
        queryFn: () => fetchPods(podParams),
    });

    const { data: allNamespaces = [] } = useQuery({
        queryKey: ["namespaces"],
        queryFn: fetchNamespaces,
    });

    const { data: allQueues = [] } = useQuery({
        queryKey: ["queues", "all"],
        queryFn: fetchQueues,
    });

    const pods = useMemo(() => podsData?.items || [], [podsData]);
    const totalPods = podsData?.totalCount || 0;
    const loading = podsLoading || podsFetching;
    const error = podsError
        ? getApiErrorMessage(podsError, "Failed to fetch pods")
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
    }, []);

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        queryClient.invalidateQueries({ queryKey: ["pods"] });
    }, [queryClient]);

    const handleCreatePod = async (newPod) => {
        try {
            await createPod(newPod);
            alert("Pod created successfully!");
            setCreateDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["pods"] });
        } catch (err) {
            alert(getApiErrorMessage(err, "Error creating pod"));
        }
    };

    const handlePodClick = useCallback(
        async (pod) => {
            try {
                setActionError(null);
                const yaml = await queryClient.fetchQuery({
                    queryKey: [
                        "podYaml",
                        pod.metadata.namespace,
                        pod.metadata.name,
                    ],
                    queryFn: () =>
                        fetchPodYaml(pod.metadata.namespace, pod.metadata.name),
                });

                const formattedYaml = yaml
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

                setSelectedPodName(pod.metadata.name);
                setSelectedPodYaml(formattedYaml);
                setOpenDialog(true);
            } catch (err) {
                console.error("Failed to fetch pod YAML:", err);
                setActionError(
                    getApiErrorMessage(err, "Failed to fetch pod YAML"),
                );
            }
        },
        [queryClient],
    );

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);

    const handleFilterChange = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const filterFields = useMemo(
        () => [
            {
                key: "namespace",
                label: "Namespace",
                onChange: (value) => handleFilterChange("namespace", value),
                options: allNamespaces,
                type: "select",
                value: filters.namespace,
            },
            {
                key: "queue",
                label: "Queue",
                onChange: (value) => handleFilterChange("queue", value),
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
            handleFilterChange,
            handleSearch,
            searchText,
        ],
    );

    const handlePaginationChange = useCallback((newPage, newRowsPerPage) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage || prev.page,
            rowsPerPage: newRowsPerPage || prev.rowsPerPage,
        }));
    }, []);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography
                    component="h1"
                    sx={{ fontSize: 24, fontWeight: 700 }}
                >
                    Pods
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
                        onClick={handleRefresh}
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
                        Create Pod
                    </Button>
                </Box>
            </Box>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <PodsTable
                pods={pods}
                filters={filters}
                allNamespaces={allNamespaces}
                allQueues={allQueues}
                sortDirection={sortDirection}
                onSortDirectionToggle={toggleSortDirection}
                onFilterChange={handleFilterChange}
                onPodClick={handlePodClick}
            />
            <PodsPagination
                totalPods={totalPods}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
            />
            <PodDetailsDialog
                open={openDialog}
                podName={selectedPodName}
                podYaml={selectedPodYaml}
                onClose={handleCloseDialog}
            />
            <CreateDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreate={handleCreatePod}
                title="Create a Pod"
                resourceNameLabel="Pod Name"
                resourceType="Pod"
            />
        </Box>
    );
};

export default Pods;
