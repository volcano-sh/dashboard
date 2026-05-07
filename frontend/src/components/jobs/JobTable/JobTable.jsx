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
import { useTranslation } from "../../../i18n/I18nProvider";

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
    reloadJobs,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenDeleteDialog = (job) => {
        setJobToDelete(job);
        setOpenDeleteDialog(true);
        setDeleteError(null);
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

            if (!response.ok) {
                const k8sMessage =
                    data.message ||
                    data.details ||
                    text ||
                    t("jobs.deleteError", { name: `${namespace}/${name}` });

                setDeleteError(k8sMessage);
                return;
            }

            if (reloadJobs) reloadJobs();

            handleCloseDeleteDialog();
        } catch (error) {
            setDeleteError(error.message || t("common.error"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <React.Fragment>
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
                        {jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    {t("jobs.noJobsFound")}
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
