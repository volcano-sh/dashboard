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
import { escape } from "lodash";
import {
    fetchQueues,
    fetchNamespaces,
    fetchPodGroupYaml,
    fetchPodGroups,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import PodGroupsTable from "./PodGroupsTable/PodGroupsTable";
import JobPagination from "../jobs/JobPagination"; // Reuse pagination
import PodGroupDialog from "./PodGroupDialog"; // Need to create this
import SchedulingTableFilters from "../scheduling/SchedulingTableFilters";

const PodGroups = () => {
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "All",
        queue: "All",
    });
    const [selectedYaml, setSelectedYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
        queue: null,
    });
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedName, setSelectedName] = useState("");
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

    const { data: allNamespaces = [] } = useQuery({
        queryKey: ["namespaces"],
        queryFn: fetchNamespaces,
    });

    const { data: allQueues = [] } = useQuery({
        queryKey: ["queues", "all"],
        queryFn: fetchQueues,
    });

    const podGroups = useMemo(
        () => podGroupsData?.items || [],
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

    const handleClick = useCallback(
        async (pg) => {
            try {
                setActionError(null);
                const yaml = await queryClient.fetchQuery({
                    queryKey: [
                        "podGroupYaml",
                        pg.metadata.namespace,
                        pg.metadata.name,
                    ],
                    queryFn: () =>
                        fetchPodGroupYaml(
                            pg.metadata.namespace,
                            pg.metadata.name,
                        ),
                });

                const formattedYaml = yaml
                    .split("\n")
                    .map((line) => {
                        const keyMatch = line.match(/^(\s*)([^:\s]+):/);
                        if (keyMatch) {
                            const [, indent, key] = keyMatch;
                            const value = line.slice(keyMatch[0].length);
                            return `${indent}<span class="yaml-key">${escape(key)}</span>:${escape(value)}`;
                        }
                        return escape(line);
                    })
                    .join("\n");

                setSelectedName(pg.metadata.name);
                setSelectedYaml(formattedYaml);
                setOpenDialog(true);
            } catch (err) {
                console.error("Failed to fetch YAML:", err);
                setActionError(getApiErrorMessage(err, "Failed to fetch YAML"));
            }
        },
        [queryClient],
    );

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
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

    // For now, no creation dialog
    const handleCreate = () => {
        alert("Create PodGroup not implemented yet");
    };

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
                    <Button
                        onClick={handleCreate}
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
            <PodGroupDialog
                open={openDialog}
                handleClose={handleCloseDialog}
                selectedName={selectedName}
                selectedYaml={selectedYaml}
            />
        </Box>
    );
};

export default PodGroups;
