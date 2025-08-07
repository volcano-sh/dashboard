import React, { useState } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
} from "@mui/material";
import JobTableHeader from "./JobTableHeader";
import JobTableRow from "./JobTableRow";
import JobTableDeleteDialog from "./JobTableDeleteDialog";

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
    onJobUpdate,
    reloadJobs, // (optional) for refetching after delete
}) => {
    const theme = useTheme();

    // State for delete dialog
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Open dialog with the selected job object
    const handleOpenDeleteDialog = (job) => {
        setJobToDelete(job);
        setOpenDeleteDialog(true);
        setDeleteError(null);
    };

    // Close dialog
    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setJobToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    };

    const handleDelete = async () => {
        if (!jobToDelete) return;
        setIsDeleting(true);
        try {
            const { namespace, name } = jobToDelete.metadata;
            const response = await fetch(
                `/api/jobs/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );

            // Try to parse the JSON error or success body
            let data = {};
            const contentType = response.headers.get("content-type");
            const text = await response.text();
            try {
                if (
                    contentType &&
                    contentType.includes("application/json") &&
                    text
                ) {
                    data = JSON.parse(text);
                } else {
                    data = { message: text };
                }
            } catch {
                data = { message: text };
            }

            // If DELETE failed, show the message from K8s API (data.message or data.details)
            if (!response.ok) {
                // Prefer Kubernetes' error message or fallback to the raw response
                const k8sMessage =
                    data.message ||
                    data.details ||
                    text ||
                    `Job "${namespace}/${name}" could not be deleted.`;

                setDeleteError(k8sMessage);
                return;
            }

            // On success, optionally reload jobs
            if (reloadJobs) reloadJobs();

            handleCloseDeleteDialog();
        } catch (error) {
            setDeleteError(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <React.Fragment>
            <TableContainer
                component={Paper}
                sx={{
                    width: '100%',
                    maxWidth: '100%',
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
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.3,
                            ),
                        },
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05,
                        ),
                        borderRadius: "5px",
                    },
                }}
            >
                <Table
                    stickyHeader
                    sx={{
                        minWidth: 750,
                        tableLayout: 'auto',
                    }}
                >
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
                        {jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            jobs.map((job) => (
                                <JobTableRow
                                    key={`${job.metadata.namespace}-${job.metadata.name}`}
                                    job={job}
                                    handleJobClick={handleJobClick}
                                    handleOpenDeleteDialog={
                                        handleOpenDeleteDialog
                                    }
                                    onJobUpdate={onJobUpdate}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <JobTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDelete}
                jobToDelete={
                    jobToDelete
                        ? `${jobToDelete.metadata.namespace}/${jobToDelete.metadata.name}`
                        : ""
                }
                error={deleteError}
                isDeleting={isDeleting}
            />
        </React.Fragment>
    );
};

export default JobTable;
