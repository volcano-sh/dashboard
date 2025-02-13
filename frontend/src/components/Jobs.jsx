import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
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
    Fab
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    Clear,
    Refresh,
    FilterList,
    Add,
    Edit,
    Delete,
} from "@mui/icons-material";
import axios from "axios";
import { fetchAllNamespaces, fetchAllQueues } from "./utils";

const Jobs = () => {
    const theme = useTheme();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ namespace: "", status: "" });
    const [searchText, setSearchText] = useState("");
    const [sortDirection, setSortDirection] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [jobData, setJobData] = useState({ name: "", namespace: "", queue: "" });

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/jobs", {
                params: { search: searchText, namespace: filters.namespace, status: filters.status },
            });
            setJobs(response.data.items || []);
        } catch (err) {
            setError("Failed to fetch jobs: " + err.message);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [searchText, filters]);

    useEffect(() => {
        fetchJobs();
        fetchAllNamespaces();
        fetchAllQueues();
    }, [fetchJobs]);

    const handleSort = () => {
        const direction = sortDirection === "asc" ? "desc" : "asc";
        setSortDirection(direction);
        setJobs([...jobs].sort((a, b) => {
            return direction === "asc" 
                ? new Date(a.metadata.creationTimestamp) - new Date(b.metadata.creationTimestamp) 
                : new Date(b.metadata.creationTimestamp) - new Date(a.metadata.creationTimestamp);
        }));
    };

    const handleCreateJob = async () => {
        try {
            await axios.post("/api/jobs", jobData);
            setOpenDialog(false);
            fetchJobs();
        } catch (err) {
            console.error("Failed to create job", err);
        }
    };

    const handleDeleteJob = async (name) => {
        try {
            await axios.delete(`/api/jobs/${name}`);
            fetchJobs();
        } catch (err) {
            console.error("Failed to delete job", err);
        }
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: "center", fontWeight: "bold", color: theme.palette.primary.main }}>
                Volcano Jobs Status
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
                <TextField
                    sx={{ maxWidth: 200 }}
                    placeholder="Search"
                    variant="outlined"
                    size="small"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                        endAdornment: searchText && (
                            <IconButton size="small" onClick={() => setSearchText("")}> <Clear /> </IconButton>
                        ),
                    }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" color="primary" startIcon={<Refresh />} onClick={fetchJobs}>
                        Refresh
                    </Button>
                    <Fab color="primary" size="small" onClick={() => setOpenDialog(true)}>
                        <Add />
                    </Fab>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: "70vh", overflow: "auto", borderRadius: 2, boxShadow: 3 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Namespace
                                <IconButton onClick={() => setFilters({ ...filters, namespace: "" })}>
                                    <FilterList />
                                </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Queue</TableCell>
                            <TableCell sx={{ fontWeight: "bold", cursor: "pointer" }} onClick={handleSort}>
                                Creation Time {sortDirection && (sortDirection === "asc" ? <ArrowUpward /> : <ArrowDownward />)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Status
                                <IconButton onClick={() => setFilters({ ...filters, status: "" })}>
                                    <FilterList />
                                </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.metadata.name} hover>
                                <TableCell>{job.metadata.name}</TableCell>
                                <TableCell>{job.metadata.namespace}</TableCell>
                                <TableCell>{job.spec.queue || "N/A"}</TableCell>
                                <TableCell>{new Date(job.metadata.creationTimestamp).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip label={job.status?.state?.phase || "Unknown"} sx={{ bgcolor: "grey.200", fontWeight: "bold" }} />
                                </TableCell>
                                <TableCell>
                                    <IconButton color="primary"><Edit /></IconButton>
                                    <IconButton color="error" onClick={() => handleDeleteJob(job.metadata.name)}><Delete /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Jobs;