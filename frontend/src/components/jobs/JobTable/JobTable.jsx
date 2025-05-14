import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
    alpha,
} from "@mui/material";
import JobTableHeader from "./JobTableHeader";
import JobTableRow from "./JobTableRow";
import EmptyState from "../../common/EmptyState";

const JobTable = ({
    jobs = [],
    handleJobClick,
    filters,
    uniqueStatuses,
    allNamespaces,
    allQueues,
    anchorEl,
    handleFilterClick,
    handleFilterClose,
    sortDirection,
    toggleSortDirection,
    onRefresh,
}) => {
    const theme = useTheme();

    // Check if filters are applied
    const hasFilters =
        filters.status !== "All" ||
        filters.namespace !== "All" ||
        (filters.queue && filters.queue !== "All");

    // Function to clear all filters
    const handleClearFilters = () => {
        handleFilterClose("status", "All");
        handleFilterClose("namespace", "All");
        if (filters.queue) {
            handleFilterClose("queue", "All");
        }
    };

    return (
        <TableContainer
            component={Paper}
            sx={{
                maxHeight: "calc(100vh - 200px)",
                overflow: "auto",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                "&::-webkit-scrollbar": {
                    width: "10px",
                    height: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "5px",
                    "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    },
                },
                "&::-webkit-scrollbar-track": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: "5px",
                },
            }}
        >
            <Table stickyHeader>
                <JobTableHeader
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
                <TableBody>
                    {jobs.length > 0 ? (
                        jobs.map((job) => (
                            <JobTableRow
                                key={`${job.metadata.namespace}-${job.metadata.name}`}
                                job={job}
                                handleJobClick={handleJobClick}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan="100%">
                                <EmptyState
                                    resourceType="Job"
                                    hasFilters={hasFilters}
                                    onClearFilters={handleClearFilters}
                                    onRefresh={onRefresh}
                                    customMessages={{
                                        noDataDescription:
                                            "There are currently no jobs scheduled in the cluster.",
                                        noMatchDescription:
                                            "No jobs match your current filter criteria. Try adjusting your filters to see more results.",
                                    }}
                                    customButtons={{
                                        refreshText: "Refresh Jobs",
                                    }}
                                />
                            </td>
                        </tr>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default JobTable;
