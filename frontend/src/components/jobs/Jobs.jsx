import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from "axios";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces, fetchAllQueues } from "../utils";
import JobTable from "./JobTable/JobTable";
import JobPagination from "./JobPagination";
import JobDialog from "./JobDialog";

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
    const [dialogMode, setDialogMode] = useState('view');
    const [selectedJobNamespace, setSelectedJobNamespace] = useState('default');

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/jobs`, {
                params: {
                    search: searchText,
                    namespace: filters.namespace,
                    queue: filters.queue,
                    status: filters.status,
                },
            });

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = response.data;
            setCachedJobs(data.items || []);
            setTotalJobs(data.totalCount || 0);
        } catch (err) {
            setError("Failed to fetch jobs: " + err.message);
            setCachedJobs([]);
        } finally {
            setLoading(false);
        }
    }, [searchText, filters]);

    useEffect(() => {
        fetchJobs();
        fetchAllNamespaces().then(setAllNamespaces);
        fetchAllQueues().then(setAllQueues);
    }, [fetchJobs]);

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
        fetchJobs();
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        fetchJobs();
    }, [fetchJobs]);

    const handleCreateJob = () => {
        setSelectedJobName('');
        setSelectedJobYaml('');
        setSelectedJobNamespace('default');
        setDialogMode('create');
        setOpenDialog(true);
    };

    const handleJobClick = useCallback(async (job) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/job/${job.metadata.namespace}/${job.metadata.name}/yaml`,
                { responseType: "text" },
            );

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

            setSelectedJobName(job.metadata.name);
            setSelectedJobYaml(formattedYaml);
            setDialogMode('view');
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch job YAML:", err);
            setError("Failed to fetch job YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleEditJob = async (job) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/job/${job.metadata.namespace}/${job.metadata.name}/yaml`,
                { responseType: "text" },
            );
        
            setSelectedJobName(job.metadata.name);
            setSelectedJobNamespace(job.metadata.namespace);
            setSelectedJobYaml(response.data);
            setDialogMode('edit');
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch job YAML:", err);
            setError("Failed to fetch job YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = useCallback((refreshNeeded = false) => {
        setOpenDialog(false);
        if (refreshNeeded) {
            fetchJobs();
        }
    },[fetchJobs]);

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

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TitleComponent text="VOLCANO JOBS STATUS" />
                
                {/* CREATE JOB button in top-right */}
                <Button
                    variant="contained"
                    color="error"
                    startIcon={<AddIcon />}
                    onClick={handleCreateJob}
                    sx={{ 
                        height: '40px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                    }}
                >
                    CREATE JOB
                </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', width: '400px' }}>
                    <input
                        type="text"
                        value={searchText}
                        onChange={handleSearch}
                        placeholder="Search jobs..."
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 40px',
                            borderRadius: '20px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <Box sx={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 21L16.65 16.65" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </Box>
                </Box>
                
                {/* Position Refresh button to match Pods UI */}
                <Button
                    variant="contained"
                    color="error"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{ 
                        height: '40px',
                        borderRadius: '20px'
                    }}
                >
                    Refresh Jobs
                </Button>
            </Box>
            
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
                onEditJob={handleEditJob}
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
                selectedJobNamespace={selectedJobNamespace}
                mode={dialogMode}
            />
        </Box>
    );
};

export default Jobs;