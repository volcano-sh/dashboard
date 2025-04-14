import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { trpc } from "../../utils/trpc";
import TitleComponent from "../Titlecomponent";
import JobTable from "./JobTable";
import JobPagination from "./JobPagination";
import JobDialog from "./JobDialog";
import SearchBar from "../Searchbar";

const Jobs = () => {
    const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 });
    const [searchText, setSearchText] = useState("");
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "default",
        queue: "All",
    });
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
        queue: null,
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedJobYaml, setSelectedJobYaml] = useState("");
    const [selectedJobName, setSelectedJobName] = useState("");
    const [sortDirection, setSortDirection] = useState("");

    const theme = useTheme();

    const {
        data: jobData,
        refetch: refetchJobs,
        isLoading,
        error,
    } = trpc.job.getJobs.useQuery({
        search: searchText,
        namespace: filters.namespace,
        queue: filters.queue,
        status: filters.status,
    });

    const { data: allNamespaces = [] } = trpc.job.getAllNamespaces.useQuery();
    const { data: allQueues = [] } = trpc.job.getAllQueues.useQuery();

    const jobYamlQuery = trpc.job.getJobYaml.useMutation();

    const cachedJobs = jobData?.items ?? [];
    const totalJobs = jobData?.totalCount ?? 0;

    const jobs = useMemo(() => {
        const start = (pagination.page - 1) * pagination.rowsPerPage;
        const end = start + pagination.rowsPerPage;
        return cachedJobs.slice(start, end);
    }, [cachedJobs, pagination]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        refetchJobs();
    };

    const handleRefresh = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        refetchJobs();
    };

    const handleJobClick = async (job) => {
        try {
            const res = await jobYamlQuery.mutateAsync({
                namespace: job.metadata.namespace,
                name: job.metadata.name,
            });

            const formattedYaml = res
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
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleChangePage = (event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleChangeRowsPerPage = (event) => {
        setPagination({
            rowsPerPage: parseInt(event.target.value, 10),
            page: 1,
        });
    };

    const handleFilterClick = (filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    };

    const handleFilterClose = (filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const uniqueStatuses = useMemo(() => {
        return [
            "All",
            ...new Set(
                jobs.map((job) => job.status?.state.phase).filter(Boolean),
            ),
        ];
    }, [jobs]);

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

    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">
                        Failed to fetch jobs: {error.message}
                    </Typography>
                </Box>
            )}
            <TitleComponent text="Volcano Jobs Status" />
            <SearchBar
                searchText={searchText}
                handleSearch={handleSearch}
                handleClearSearch={handleClearSearch}
                handleRefresh={handleRefresh}
                fetchData={refetchJobs}
                isRefreshing={isLoading}
                placeholder="Search jobs..."
                refreshLabel="Refresh Job Listings"
            />
            <JobTable
                jobs={sortedJobs}
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
