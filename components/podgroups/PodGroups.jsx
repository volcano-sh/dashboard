import React, { useCallback, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    InputAdornment,
    LinearProgress,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { escape } from "lodash";
import {
    fetchNamespaces,
    fetchPodGroupYaml,
    fetchPodGroups,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import PodGroupsTable from "./PodGroupsTable/PodGroupsTable";
import JobPagination from "../jobs/JobPagination"; // Reuse pagination
import PodGroupDialog from "./PodGroupDialog"; // Need to create this
import { Plus, RefreshCw, Search } from "lucide-react";

const PodGroups = () => {
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "All",
    });
    const [selectedYaml, setSelectedYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
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
        status: filters.status,
    };

    const {
        data: podGroupsData,
        error: podGroupsError,
        isFetching: podGroupsFetching,
        isLoading: podGroupsLoading,
        refetch: refetchPodGroups,
    } = useQuery({
        queryKey: ["podgroups", searchText, filters.namespace, filters.status],
        queryFn: () => fetchPodGroups(podGroupParams),
    });

    const { data: allNamespaces = [] } = useQuery({
        queryKey: ["namespaces"],
        queryFn: fetchNamespaces,
    });

    const cachedPodGroups = useMemo(
        () => podGroupsData?.items || [],
        [podGroupsData],
    );
    const totalItems = podGroupsData?.totalCount || 0;
    const loading = podGroupsLoading || podGroupsFetching;
    const error = podGroupsError
        ? getApiErrorMessage(podGroupsError, "Failed to fetch podgroups")
        : actionError;

    const podGroups = useMemo(() => {
        const startIndex = (pagination.page - 1) * pagination.rowsPerPage;
        const endIndex = startIndex + pagination.rowsPerPage;
        return cachedPodGroups.slice(startIndex, endIndex);
    }, [cachedPodGroups, pagination]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

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
                cachedPodGroups.map((pg) => pg.status?.phase).filter(Boolean),
            ),
        ];
    }, [cachedPodGroups]);

    const sortedPodGroups = useMemo(() => {
        return [...podGroups].sort((a, b) => {
            const compareResult =
                new Date(b.metadata.creationTimestamp) -
                new Date(a.metadata.creationTimestamp);
            return sortDirection === "desc" ? compareResult : -compareResult;
        });
    }, [podGroups, sortDirection]);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
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
                    alignItems: { xs: "stretch", md: "center" },
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 1.5,
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <TextField
                    onChange={handleSearch}
                    placeholder="Search PodGroups..."
                    size="small"
                    value={searchText}
                    sx={{ minWidth: 280 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                    <Button
                        onClick={handleClearSearch}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Clear
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={() => refetchPodGroups()}
                        startIcon={<RefreshCw size={17} />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                    <Button
                        onClick={handleCreate}
                        startIcon={<Plus size={16} />}
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
                podGroups={sortedPodGroups}
                handlePodGroupClick={handleClick}
                filters={filters}
                uniqueStatuses={uniqueStatuses}
                allNamespaces={allNamespaces}
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
