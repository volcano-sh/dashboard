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
    toggleSortDirection,
    onEditJob,
}) => {
    const theme = useTheme();
     
    const handleOpenDeleteDialog = () => {};
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
                    {jobs.map((job) => (
                        <JobTableRow
                            key={`${job.metadata.namespace}-${job.metadata.name}`}
                            job={job}
                            handleJobClick={handleJobClick}
                            handleOpenDeleteDialog={handleOpenDeleteDialog}
                            onEditJob={onEditJob}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default JobTable;