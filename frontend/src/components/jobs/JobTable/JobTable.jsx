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
import DeleteDialog from "../../Reusable-components/DeleteDialog";

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
}) => {
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [jobToDelete, setJobToDelete] = React.useState(null);
    const [deleteError, setDeleteError] = React.useState(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [jobsState, setJobsState] = React.useState(jobs);

    React.useEffect(() => {
        setJobsState(jobs);
    }, [jobs]);

    const handleOpenDeleteDialog = (job) => {
        setJobToDelete(job);
        setOpenDeleteDialog(true);
    };

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
            let data = {};
            const contentType = response.headers.get("content-type");
            const text = await response.text();
            let isJsonResponse = false;
            try {
                if (
                    (contentType && contentType.includes("application/json")) ||
                    (text && !text.trim().startsWith("<"))
                ) {
                    data = text ? JSON.parse(text) : {};
                    isJsonResponse = true;
                }
            } catch (parseError) {}
            if (!response.ok) {
                let customMessage = `Job "${namespace}/${name}" could not be deleted.`;
                let errorType = "UnknownError";
                if (
                    isJsonResponse &&
                    typeof data === "object" &&
                    (data.error || data.details)
                ) {
                    customMessage = data.error || data.details;
                    if (customMessage.toLowerCase().includes("denied")) {
                        errorType = "ValidationError";
                    } else {
                        errorType = "KubernetesError";
                    }
                }
                const fullMessage = `Cannot delete job "${namespace}/${name}". Error message: ${customMessage}`;
                const error = new Error(fullMessage);
                error.type = errorType;
                error.status = response.status;
                throw error;
            }
            setJobsState((prev) =>
                prev.filter(
                    (j) =>
                        !(
                            j.metadata.namespace === namespace &&
                            j.metadata.name === name
                        ),
                ),
            );
            handleCloseDeleteDialog();
        } catch (error) {
            setDeleteError(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
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
                        {jobsState.map((job) => (
                            <JobTableRow
                                key={`${job.metadata.namespace}-${job.metadata.name}`}
                                job={job}
                                handleJobClick={handleJobClick}
                                handleOpenDeleteDialog={handleOpenDeleteDialog}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <DeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDelete}
                podToDelete={jobToDelete}
                error={deleteError}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default JobTable;
