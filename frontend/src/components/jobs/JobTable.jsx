import React from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography, 
    Button 
} from "@mui/material";
import { ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";
import JobStatusChip from "./JobStatusChip";
import JobFilters from "./JobFilters";

const JobTable = ({ 
    jobs, 
    handleJobClick, 
    filters, 
    uniqueStatuses, 
    allNamespaces, 
    allQueues, 
    anchorEl, 
    handleFilterClick, 
    handleFilterClose, 
    sortDirection, 
    toggleSortDirection 
}) => {
    return (
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
                            <JobFilters
                                filterType="namespace"
                                currentValue={filters.namespace}
                                options={allNamespaces}
                                handleFilterClick={handleFilterClick}
                                handleFilterClose={handleFilterClose}
                                anchorEl={anchorEl.namespace}
                            />
                        </TableCell>
                        <TableCell
                            sx={{
                                backgroundColor: "background.paper",
                                padding: "8px 16px",
                                minWidth: 120,
                            }}
                        >
                            <Typography variant="h6">Queue</Typography>
                            <JobFilters
                                filterType="queue"
                                currentValue={filters.queue}
                                options={allQueues}
                                handleFilterClick={handleFilterClick}
                                handleFilterClose={handleFilterClose}
                                anchorEl={anchorEl.queue}
                            />
                        </TableCell>
                        <TableCell
                            sx={{
                                backgroundColor: "background.paper",
                                padding: "8px 16px",
                                minWidth: 120,
                            }}
                        >
                            <Typography variant="h6">Creation Time</Typography>
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
                            <JobFilters
                                filterType="status"
                                currentValue={filters.status}
                                options={uniqueStatuses}
                                handleFilterClick={handleFilterClick}
                                handleFilterClose={handleFilterClose}
                                anchorEl={anchorEl.status}
                            />
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobs.map((job) => (
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
                                <JobStatusChip
                                    status={job.status ? job.status.state.phase : "Unknown"}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default JobTable;

