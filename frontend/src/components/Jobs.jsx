import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Search,
  Clear,
  Refresh,
  FilterList,
  ArrowDownward,
  ArrowUpward,
  UnfoldMore,
} from "@mui/icons-material";
import axios from "axios";
import { fetchAllNamespaces, fetchAllQueues } from "./utils";

const brandColor = "#eb301a";
const brandColorLight = "#FDF5F3"; // Light background shade
const brandColorHover = "#F7694A"; // Slightly lighter for hover states


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
            const response = await axios.get(
                `/api/jobs`,
                {
                    params: {
                        search: searchText,
                        namespace: filters.namespace,
                        queue: filters.queue,
                        status: filters.status,
                    },
                }
            );

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
        setPagination((prev) => ({...prev, page: 1}));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({...prev, page: 1}));
        fetchJobs();
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({...prev, page: 1}));
        setSearchText("");
        fetchJobs();
    }, [fetchJobs]);

    const handleJobClick = useCallback(async (job) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/job/${job.metadata.namespace}/${job.metadata.name}/yaml`,
                {responseType: "text"}
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
        setPagination((prev) => ({...prev, page: newPage}));
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setPagination((prev) => ({...prev, rowsPerPage: parseInt(event.target.value, 10), page: 1}));
    }, []);

    const getStatusColor = useCallback((status) => {
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
    }, [theme]);

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({...prev, [filterType]: event.currentTarget}));
    }, []);

    const handleFilterClose = useCallback((filterType, value) => {
        setFilters((prev) => ({...prev, [filterType]: value}));
        setAnchorEl((prev) => ({...prev, [filterType]: null}));
        setPagination((prev) => ({...prev, page: 1}));
    }, [fetchJobs]);

    const uniqueStatuses = useMemo(() => {
        return ["All", ...new Set(jobs.map((job) => job.status?.state.phase).filter(Boolean))];
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const statusMatch = filters.status === "All" || (job.status && job.status.state.phase === filters.status);
            const queueMatch = filters.queue === "All" || job.spec.queue === filters.queue;
            return statusMatch && queueMatch;
        });
    }, [jobs, filters]);

    const sortedJobs = useMemo(() => {
        return [...filteredJobs].sort((a, b) => {
            const compareResult = new Date(b.metadata.creationTimestamp) - new Date(a.metadata.creationTimestamp);
            return sortDirection === "desc" ? compareResult : -compareResult;
        });
    }, [filteredJobs, sortDirection]);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    return (
        <Box sx={{ bgcolor: brandColorLight, minHeight: "100vh", p: 3 }}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <Box
              sx={{
                background: `linear-gradient(45deg, ${brandColor} 30%, ${brandColorHover} 90%)`,
                p: 3,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            >
              <Typography variant="h4" sx={{ color: "white", fontWeight: "bold" }}>
                Volcano Jobs Dashboard
              </Typography>
            </Box>
    
            <CardContent>
              {error && (
                <Box sx={{ mb: 2, p: 2, bgcolor: "#FFEBE6", borderRadius: 1 }}>
                  <Typography color="error">{error}</Typography>
                </Box>
              )}
    
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                <TextField
                  placeholder="Search jobs"
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={{
                    width: 300,
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: brandColor,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: brandColor,
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: brandColor }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchText && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchText("")}>
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
    
                <Button
                  variant="contained"
                  onClick={handleRefresh}
                  sx={{
                    bgcolor: brandColor,
                    "&:hover": {
                      bgcolor: brandColorHover,
                    },
                  }}
                  startIcon={<Refresh />}
                >
                  Refresh Status
                </Button>
              </Box>
    
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: "calc(100vh - 300px)",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {["Name", "Namespace", "Queue", "Creation Time", "Status"].map((header, index) => (
                        <TableCell
                          key={header}
                          sx={{
                            bgcolor: brandColorLight,
                            fontWeight: "bold",
                            borderBottom: 2,
                            borderBottomColor: brandColor,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {header}
                            {header !== "Name" && (
                              <IconButton
                                size="small"
                                onClick={(e) => 
                                  header === "Creation Time" 
                                    ? toggleSortDirection()
                                    : handleFilterClick(header.toLowerCase(), e)
                                }
                              >
                                {header === "Creation Time" ? (
                                  sortDirection === "desc" ? (
                                    <ArrowDownward sx={{ color: brandColor }} />
                                  ) : sortDirection === "asc" ? (
                                    <ArrowUpward sx={{ color: brandColor }} />
                                  ) : (
                                    <UnfoldMore sx={{ color: brandColor }} />
                                  )
                                ) : (
                                  <FilterList sx={{ color: brandColor }} />
                                )}
                              </IconButton>
                            )}
                          </Box>
                          {header !== "Name" && header !== "Creation Time" && (
                            <Menu
                              anchorEl={anchorEl[header.toLowerCase()]}
                              open={Boolean(anchorEl[header.toLowerCase()])}
                              onClose={() => setAnchorEl((prev) => ({ ...prev, [header.toLowerCase()]: null }))}
                            >
                              {(header === "Namespace" 
                                ? allNamespaces 
                                : header === "Queue" 
                                ? allQueues 
                                : uniqueStatuses
                              ).map((item) => (
                                <MenuItem
                                  key={item}
                                  onClick={() => handleFilterClose(header.toLowerCase(), item)}
                                >
                                  {item}
                                </MenuItem>
                              ))}
                            </Menu>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedJobs.map((job) => (
                      <TableRow
                        key={`${job.metadata.namespace}-${job.metadata.name}`}
                        onClick={() => handleJobClick(job)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: brandColorLight,
                            transition: "background-color 0.2s",
                          },
                        }}
                      >
                        <TableCell>{job.metadata.name}</TableCell>
                        <TableCell>{job.metadata.namespace}</TableCell>
                        <TableCell>{job.spec.queue || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(job.metadata.creationTimestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={job.status ? job.status.state.phase : "Unknown"}
                            sx={{
                              bgcolor:
                                job.status?.state.phase === "Running"
                                  ? brandColor
                                  : job.status?.state.phase === "Failed"
                                  ? "#FF4444"
                                  : job.status?.state.phase === "Completed"
                                  ? "#4CAF50"
                                  : "#757575",
                              color: "white",
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    select
                    value={pagination.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    size="small"
                    sx={{ width: 120 }}
                  >
                    <MenuItem value={5}>5 per page</MenuItem>
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={20}>20 per page</MenuItem>
                  </TextField>
                  <Typography variant="body2">
                    Total Jobs: {totalJobs}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    disabled={pagination.page === 1}
                    onClick={() => handleChangePage(null, pagination.page - 1)}
                    sx={{ 
                      color: brandColor, 
                      borderColor: brandColor,
                      '&:hover': {
                        borderColor: brandColorHover,
                        color: brandColorHover
                      }
                    }}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ alignSelf: "center" }}>
                    Page {pagination.page} of {Math.ceil(totalJobs / pagination.rowsPerPage)}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={pagination.page >= Math.ceil(totalJobs / pagination.rowsPerPage)}
                    onClick={() => handleChangePage(null, pagination.page + 1)}
                    sx={{ 
                      color: brandColor, 
                      borderColor: brandColor,
                      '&:hover': {
                        borderColor: brandColorHover,
                        color: brandColorHover
                      }
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
    
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle
              sx={{
                bgcolor: brandColorLight,
                borderBottom: `2px solid ${brandColor}`,
              }}
            >
              Job YAML - {selectedJobName}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <pre
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "16px",
                  borderRadius: "4px",
                  overflow: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: selectedJobYaml }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={handleCloseDialog}
                variant="contained"
                sx={{
                  bgcolor: brandColor,
                  "&:hover": {
                    bgcolor: brandColorHover,
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      );
    };
    
    export default Jobs;
    