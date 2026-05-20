import React, { useState } from "react";
import { Table, TableBody, TableRow, TableCell } from "@mui/material";
import SchedulingTableSurface from "../../scheduling/SchedulingTableSurface";
import JobTableHeader from "./JobTableHeader";
import JobTableRow from "./JobTableRow";
import JobTableDeleteDialog from "./JobTableDeleteDialog"; // Be sure to have this component
import { API_BASE } from "../../../lib/client/dashboard-api";
import { getStoredToken } from "../../../lib/client/auth-token";

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
    canWrite = true,
    sortDirection,
    toggleSortDirection,
    reloadJobs, // (optional) for refetching after delete
}) => {
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
            const token = getStoredToken();
            const response = await fetch(
                `${API_BASE}/jobs/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                },
            );

            // Try to parse the JSON error or success body
            let data: any = {};
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
            <SchedulingTableSurface>
                <Table stickyHeader>
                    <JobTableHeader
                        filters={filters}
                        uniqueStatuses={uniqueStatuses}
                        allNamespaces={allNamespaces}
                        allQueues={allQueues}
                        anchorEl={anchorEl}
                        handleFilterClick={handleFilterClick}
                        handleFilterClose={handleFilterClose}
                        canWrite={canWrite}
                        sortDirection={sortDirection}
                        toggleSortDirection={toggleSortDirection}
                    />
                    <TableBody>
                        {jobs.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={canWrite ? 6 : 5}
                                    align="center"
                                >
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            jobs.map((job) => (
                                <JobTableRow
                                    canWrite={canWrite}
                                    key={`${job.metadata.namespace}-${job.metadata.name}`}
                                    job={job}
                                    handleJobClick={handleJobClick}
                                    handleOpenDeleteDialog={
                                        handleOpenDeleteDialog
                                    }
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </SchedulingTableSurface>

            {canWrite && (
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
            )}
        </React.Fragment>
    );
};

export default JobTable;
