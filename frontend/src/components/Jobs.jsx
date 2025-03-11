import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
    InputAdornment,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    Clear,
    Error,
    FilterList,
    Refresh,
    Search,
    UnfoldMore,
} from "@mui/icons-material";
import axios from "axios";
import { fetchAllNamespaces, fetchAllQueues } from "./utils";

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
            setTotalJobs(data.totalCount || 0); // update totalJobs
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
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch job YAML:", err);
            setError("Failed to fetch job YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const getStatusColor = useCallback(
        (status) => {
            switch (status) {
                case "Failed":
                    return theme.palette.error.main;
                case "Pending":
                    return theme.palette.warning.main;
                case "Running":
                    return theme.palette.success.main;
                case "Completed":
                    return theme.palette.info.main;
                default:
                    return theme.palette.grey[500];
            }
        },
        [theme],
    );

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback(
        (filterType, value) => {
            setFilters((prev) => ({ ...prev, [filterType]: value }));
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
            setPagination((prev) => ({ ...prev, page: 1 }));
        },
        [fetchJobs],
    );

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
            <Typography variant="h4" gutterBottom align="left">
                Volcano Jobs Status
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                        placeholder="Search jobs"
                        variant="outlined"
                        size="small"
                        value={searchText}
                        onChange={handleSearch}
                        sx={{ width: 200 }} // Adjust the width as needed
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconButton
                                        size="small"
                                        onClick={() => fetchJobs()}
                                        sx={{ padding: "4px" }}
                                    >
                                        <Search />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            endAdornment: searchText && (
                                <IconButton
                                    size="small"
                                    onClick={handleClearSearch}
                                    sx={{ padding: "4px" }}
                                >
                                    <Clear />
                                </IconButton>
                            ),
                        }}
                    />
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                >
                    Refresh Job Status
                </Button>
            </Box>
            <TableContainer
                component={Paper}
                sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    backgroundColor: "background.paper",
                                    padding: "8px 16px",
                                    minWidth: 120,
                                }}
                            >
                                <Typography variant="h6">Name</Typography>
                            </TableCell>
                            <TableCell
                                sx={{
                                    backgroundColor: "background.paper",
                                    padding: "8px 16px",
                                    minWidth: 120,
                                }}
                            >
                                <Typography variant="h6">Namespace</Typography>
                                <Button
                                    size="small"
                                    startIcon={<FilterList />}
                                    onClick={(e) =>
                                        handleFilterClick("namespace", e)
                                    }
                                    sx={{
                                        textTransform: "none",
                                        padding: 0,
                                        minWidth: "auto",
                                    }}
                                >
                                    Filter: {filters.namespace}
                                </Button>
                                <Menu
                                    anchorEl={anchorEl.namespace}
                                    open={Boolean(anchorEl.namespace)}
                                    onClose={() =>
                                        setAnchorEl((prev) => ({
                                            ...prev,
                                            namespace: null,
                                        }))
                                    }
                                >
                                    {allNamespaces.map((namespace) => (
                                        <MenuItem
                                            key={namespace}
                                            onClick={() =>
                                                handleFilterClose(
                                                    "namespace",
                                                    namespace,
                                                )
                                            }
                                        >
                                            {namespace}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </TableCell>
                            <TableCell
                                sx={{
                                    backgroundColor: "background.paper",
                                    padding: "8px 16px",
                                    minWidth: 120,
                                }}
                            >
                                <Typography variant="h6">Queue</Typography>
                                <Button
                                    size="small"
                                    startIcon={<FilterList />}
                                    onClick={(e) =>
                                        handleFilterClick("queue", e)
                                    }
                                    sx={{
                                        textTransform: "none",
                                        padding: 0,
                                        minWidth: "auto",
                                    }}
                                >
                                    Filter: {filters.queue}
                                </Button>
                                <Menu
                                    anchorEl={anchorEl.queue}
                                    open={Boolean(anchorEl.queue)}
                                    onClose={() =>
                                        setAnchorEl((prev) => ({
                                            ...prev,
                                            queue: null,
                                        }))
                                    }
                                >
                                    {allQueues.map((queue) => (
                                        <MenuItem
                                            key={queue}
                                            onClick={() =>
                                                handleFilterClose(
                                                    "queue",
                                                    queue,
                                                )
                                            }
                                            selected={queue === filters.queue}
                                        >
                                            {queue}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </TableCell>
                            <TableCell
                                sx={{
                                    backgroundColor: "background.paper",
                                    padding: "8px 16px",
                                    minWidth: 120,
                                }}
                            >
                                <Typography variant="h6">
                                    Creation Time
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={toggleSortDirection}
                                    startIcon={
                                        sortDirection === "desc" ? (
                                            <ArrowDownward />
                                        ) : sortDirection === "asc" ? (
                                            <ArrowUpward />
                                        ) : (
                                            <UnfoldMore />
                                        )
                                    }
                                    sx={{
                                        textTransform: "none",
                                        padding: 0,
                                        minWidth: "auto",
                                    }}
                                >
                                    Sort
                                </Button>
                            </TableCell>
                            <TableCell
                                sx={{
                                    backgroundColor: "background.paper",
                                    padding: "8px 16px",
                                    minWidth: 120,
                                }}
                            >
                                <Typography variant="h6">Status</Typography>
                                <Button
                                    size="small"
                                    startIcon={<FilterList />}
                                    onClick={(e) =>
                                        handleFilterClick("status", e)
                                    }
                                    sx={{
                                        textTransform: "none",
                                        padding: 0,
                                        minWidth: "auto",
                                    }}
                                >
                                    Filter: {filters.status}
                                </Button>
                                <Menu
                                    anchorEl={anchorEl.status}
                                    open={Boolean(anchorEl.status)}
                                    onClose={() =>
                                        setAnchorEl((prev) => ({
                                            ...prev,
                                            status: null,
                                        }))
                                    }
                                >
                                    {uniqueStatuses.map((status) => (
                                        <MenuItem
                                            key={status}
                                            onClick={() =>
                                                handleFilterClose(
                                                    "status",
                                                    status,
                                                )
                                            }
                                        >
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedJobs.map((job) => (
                            <TableRow
                                key={`${job.metadata.namespace}-${job.metadata.name}`}
                                sx={{
                                    "&:nth-of-type(odd)": {
                                        bgcolor: "action.hover",
                                    },
                                    "&:hover": {
                                        bgcolor: "action.hover",
                                        color: "primary.main",
                                        boxShadow:
                                            "0px 4px 6px rgba(0, 0, 0, 0.1)",
                                    },
                                    cursor: "pointer",
                                }}
                                onClick={() => handleJobClick(job)}
                            >
                                <TableCell>{job.metadata.name}</TableCell>
                                <TableCell>{job.metadata.namespace}</TableCell>
                                <TableCell>{job.spec.queue || "N/A"}</TableCell>
                                <TableCell>
                                    {new Date(
                                        job.metadata.creationTimestamp,
                                    ).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={
                                            job.status
                                                ? job.status.state.phase
                                                : "Unknown"
                                        }
                                        sx={{
                                            bgcolor: getStatusColor(
                                                job.status
                                                    ? job.status.state.phase
                                                    : "Unknown",
                                            ),
                                            color: "common.white",
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Select
                    value={pagination.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    size="small"
                >
                    <MenuItem value={5}>5 per page</MenuItem>
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={20}>20 per page</MenuItem>
                </Select>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 2,
                        mb: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        Total Jobs: {totalJobs}
                    </Typography>
                    <Pagination
                        count={Math.ceil(totalJobs / pagination.rowsPerPage)}
                        page={pagination.page}
                        onChange={handleChangePage}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Box>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        width: "80%",
                        maxWidth: "800px",
                        maxHeight: "90vh",
                        m: 2,
                        bgcolor: "background.paper",
                    },
                }}
            >
                <DialogTitle>Job YAML - {selectedJobName}</DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            mt: 2,
                            mb: 2,
                            fontFamily: "monospace",
                            fontSize: "1.2rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 150px)",
                            bgcolor: "grey.50",
                            p: 2,
                            borderRadius: 1,
                            "& .yaml-key": {
                                fontWeight: 700,
                                color: "#000",
                            },
                        }}
                    >
                        <pre
                            dangerouslySetInnerHTML={{
                                __html: selectedJobYaml,
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 2,
                            width: "100%",
                            px: 2,
                            pb: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCloseDialog}
                            sx={{
                                minWidth: "100px",
                                "&:hover": {
                                    bgcolor: "primary.dark",
                                },
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Jobs;
