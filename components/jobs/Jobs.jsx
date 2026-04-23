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
import {
    createJob,
    fetchJobYaml,
    fetchJobs,
    fetchNamespaces,
    fetchQueues,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import JobTable from "./JobTable/JobTable";
import JobPagination from "./JobPagination";
import JobDialog from "./JobDialog";
import CreateJobDialog from "./JobTable/CreateJobDialog";
import { Plus, RefreshCw, Search } from "lucide-react";

const Jobs = () => {
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "default",
        queue: "All",
    });
    const [selectedJobYaml, setSelectedJobYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
        queue: null,
    });
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedJobName, setSelectedJobName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [sortDirection, setSortDirection] = useState("desc");
    const [actionError, setActionError] = useState(null);
    const queryClient = useQueryClient();

    const jobParams = {
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
        data: jobsData,
        error: jobsError,
        isFetching: jobsFetching,
        isLoading: jobsLoading,
        refetch: refetchJobs,
    } = useQuery({
        queryKey: [
            "jobs",
            searchText,
            filters.namespace,
            filters.queue,
            filters.status,
            pagination.page,
            pagination.rowsPerPage,
            sortDirection,
        ],
        queryFn: () => fetchJobs(jobParams),
    });

    const { data: allNamespaces = [] } = useQuery({
        queryKey: ["namespaces"],
        queryFn: fetchNamespaces,
    });

    const { data: allQueues = [] } = useQuery({
        queryKey: ["queues", "all"],
        queryFn: fetchQueues,
    });

    const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
    const totalJobs = jobsData?.totalCount || 0;
    const loading = jobsLoading || jobsFetching;
    const error = jobsError
        ? getApiErrorMessage(jobsError, "Failed to fetch jobs")
        : actionError;

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleJobClick = useCallback(
        async (job) => {
            try {
                setActionError(null);
                const yaml = await queryClient.fetchQuery({
                    queryKey: [
                        "jobYaml",
                        job.metadata.namespace,
                        job.metadata.name,
                    ],
                    queryFn: () =>
                        fetchJobYaml(job.metadata.namespace, job.metadata.name),
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

                setSelectedJobName(job.metadata.name);
                setSelectedJobYaml(formattedYaml);
                setOpenDialog(true);
            } catch (err) {
                console.error("Failed to fetch job YAML:", err);
                setActionError(
                    getApiErrorMessage(err, "Failed to fetch job YAML"),
                );
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

    const handleCreateJob = async (newJob) => {
        try {
            await createJob(newJob);
            alert("Job created successfully!");
            setCreateDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        } catch (err) {
            alert(getApiErrorMessage(err, "Error creating job"));
        }
    };

    const handleFilterClose = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const uniqueStatuses = useMemo(() => {
        return [
            "All",
            ...new Set(
                jobs
                    .map(
                        (job) =>
                            job.summary?.status || job.status?.state?.phase,
                    )
                    .filter(Boolean),
            ),
        ];
    }, [jobs]);

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
                    Jobs
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
                    placeholder="Search jobs..."
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
                        onClick={() => refetchJobs()}
                        disabled={loading}
                        startIcon={<RefreshCw size={17} />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
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
                        Create Job
                    </Button>
                </Box>
            </Box>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <JobTable
                jobs={jobs}
                handleJobClick={handleJobClick}
                filters={filters}
                uniqueStatuses={uniqueStatuses}
                allNamespaces={allNamespaces}
                allQueues={allQueues}
                anchorEl={anchorEl}
                handleFilterClick={handleFilterClick}
                handleFilterClose={handleFilterClose}
                sortDirection={sortDirection}
                toggleSortDirection={toggleSortDirection}
                reloadJobs={() =>
                    queryClient.invalidateQueries({ queryKey: ["jobs"] })
                }
            />
            <JobPagination
                pagination={pagination}
                totalJobs={totalJobs}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
            <JobDialog
                open={openDialog}
                handleClose={handleCloseDialog}
                selectedJobName={selectedJobName}
                selectedJobYaml={selectedJobYaml}
            />
            <CreateJobDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreate={handleCreateJob}
                title="Create a Job"
                resourceNameLabel="Job Name"
                resourceType="Job"
            />
        </Box>
    );
};

export default Jobs;
