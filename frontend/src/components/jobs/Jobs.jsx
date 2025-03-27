import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import axios from "axios";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces, fetchAllQueues } from "../utils";
import JobTable from "./JobTable";
import JobPagination from "./JobPagination";
import JobDialog from "./JobDialog";
import SearchBar from "../Searchbar";
import { trpc } from "../../utils/trpc";

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [cachedJobs, setCachedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allNamespaces, setAllNamespaces] = useState([]);
    const [allQueues, setAllQueues] = useState([]);
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "default",
        queue: "All",
    });
    const [selectedJobYaml, setSelectedJobYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
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
    const [totalJobs, setTotalJobs] = useState(0);
    const [sortDirection, setSortDirection] = useState("");

    const jobsQuery = trpc.jobsRouter.getJobs.useQuery(
        {
            search: searchText,
            namespace: filters.namespace,
            queue: filters.queue,
            status: filters.status,
            page: pagination.page,
            pageSize: pagination.rowsPerPage,
            sortField: "creationTime",
            sortDirection: sortDirection || "asc",
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching jobs:", err);
                setError(`Jobs API error: ${err.message}`);
            },
        },
    );

    const namespacesQuery = trpc.namespaceRouter.getNamespaces.useQuery(
        {},
        {
            onError: (err) => {
                console.error("Error fetching namespaces:", err);
                setError(`Namespaces API error: ${err.message}`);
            },
        },
    );

    const queuesQuery = trpc.queueRouter.getAllQueues.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching queues:", err);
                setError(`Queues API error: ${err.message}`);
            },
        },
    );

    const jobYamlQuery = trpc.jobsRouter.getJobYaml.useQuery(
        {
            namespace: filters.namespace,
            name: selectedJobName,
        },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching job YAML:", err);
                setError(`Job YAML API error: ${err.message}`);
            },
        },
    );

    useEffect(() => {
        if (jobsQuery.data) {
            setCachedJobs(jobsQuery.data.items || []);
            setTotalJobs(jobsQuery.data.totalCount || 0);
        }
    }, [jobsQuery.data]);

    useEffect(() => {
        const startIndex = (pagination.page - 1) * pagination.rowsPerPage;
        const endIndex = startIndex + pagination.rowsPerPage;
        setJobs(cachedJobs.slice(startIndex, endIndex));
    }, [cachedJobs, pagination]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        jobsQuery.refetch();
        namespacesQuery.refetch();
        queuesQuery.refetch();
    }, [jobsQuery, namespacesQuery, queuesQuery]);

    const handleJobClick = useCallback(
        async (job) => {
            try {
                setSelectedJobName(job.metadata.name);
                const response = await jobYamlQuery.refetch();

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

                setSelectedJobYaml(formattedYaml);
                setOpenDialog(true);
            } catch (err) {
                console.error("Failed to fetch job YAML:", err);
                setError("Failed to fetch job YAML: " + err.message);
            }
        },
        [jobYamlQuery],
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
                jobsQuery.data?.items
                    ?.map((job) => job.status?.state.phase)
                    .filter(Boolean) || [],
            ),
        ];
    }, [jobsQuery.data]);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const statusMatch =
                filters.status === "All" ||
                (job.status && job.status.state.phase === filters.status);
            const queueMatch =
                filters.queue === "All" || job.spec.queue === filters.queue;
            return statusMatch && queueMatch;
        });
    }, [jobs, filters]);

    const sortedJobs = useMemo(() => {
        return [...filteredJobs].sort((a, b) => {
            const compareResult =
                new Date(b.metadata.creationTimestamp) -
                new Date(a.metadata.creationTimestamp);
            return sortDirection === "desc" ? compareResult : -compareResult;
        });
    }, [filteredJobs, sortDirection]);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    const isLoading =
        jobsQuery.isLoading ||
        namespacesQuery.isLoading ||
        queuesQuery.isLoading;
    const isRefreshing =
        jobsQuery.isRefetching ||
        namespacesQuery.isRefetching ||
        queuesQuery.isRefetching;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <TitleComponent text="Volcano Jobs Status" />
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={handleRefresh}
                    fetchData={handleRefresh}
                    isRefreshing={isRefreshing}
                    placeholder="Search jobs..."
                    refreshLabel="Refresh Job Listings"
                />
            </Box>
            <JobTable
                jobs={sortedJobs}
                isLoading={isLoading}
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
        </Box>
    );
};

export default Jobs;
