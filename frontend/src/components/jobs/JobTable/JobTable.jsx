import React, { useState } from "react";
import PropTypes from "prop-types";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
    Button,
    Menu,
    MenuItem,
    Box,
} from "@mui/material";
import { FilterAlt } from "@mui/icons-material";
import JobTableHeader from "./JobTableHeader";
import JobTableRow from "./JobTableRow";
import JobTableDeleteDialog from "./JobTableDeleteDialog";

const JobTable = ({
    jobs,
    handleJobClick,
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

    // Filter states
    const [filterMenuAnchor, setFilterMenuAnchor] = useState({
        status: null,
        namespace: null,
        queue: null,
    });
    const [activeFilters, setActiveFilters] = useState({
        status: "All",
        namespace: "All",
        queue: "All",
    });

    // Delete dialog states
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter handlers
    const handleFilterButtonClick = (event, filterType) => {
        setFilterMenuAnchor((prev) => ({
            ...prev,
            [filterType]: event.currentTarget,
        }));
    };

    const handleFilterMenuClose = (filterType) => {
        setFilterMenuAnchor((prev) => ({
            ...prev,
            [filterType]: null,
        }));
    };

    const handleFilterSelect = (filterType, value) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterType]: value,
        }));
        handleFilterMenuClose(filterType);
    };

    // Get filter options based on type
    const getFilterOptions = (filterType) => {
        switch (filterType) {
            case "status":
                return ["All", ...uniqueStatuses];
            case "namespace":
                return ["All", ...allNamespaces];
            case "queue":
                return ["All", ...allQueues];
            default:
                return [];
        }
    };

    // Filter jobs based on active filters
    const filteredJobs = jobs.filter((job) => {
        const statusMatch =
            activeFilters.status === "All" ||
            job.status?.state?.phase === activeFilters.status;
        const namespaceMatch =
            activeFilters.namespace === "All" ||
            job.metadata?.namespace === activeFilters.namespace;
        const queueMatch =
            activeFilters.queue === "All" ||
            job.spec?.queue === activeFilters.queue;

        return statusMatch && namespaceMatch && queueMatch;
    });

    // Delete handlers
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
                    `Job "${namespace}/${name}" could not be deleted.`;

                setDeleteError(k8sMessage);
                return;
            }

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
            <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                {["status", "namespace", "queue"].map((filterType) => (
                    <Button
                        key={filterType}
                        variant={
                            activeFilters[filterType] !== "All"
                                ? "contained"
                                : "outlined"
                        }
                        size="small"
                        onClick={(e) => handleFilterButtonClick(e, filterType)}
                        startIcon={<FilterAlt />}
                        sx={{
                            textTransform: "capitalize",
                            borderRadius: "8px",
                            backgroundColor:
                                activeFilters[filterType] !== "All"
                                    ? alpha(theme.palette.primary.main, 0.1)
                                    : "transparent",
                            "&:hover": {
                                backgroundColor:
                                    activeFilters[filterType] !== "All"
                                        ? alpha(theme.palette.primary.main, 0.2)
                                        : alpha(
                                              theme.palette.primary.main,
                                              0.05,
                                          ),
                            },
                        }}
                    >
                        {filterType}
                    </Button>
                ))}
            </Box>

            {["status", "namespace", "queue"].map((filterType) => (
                <Menu
                    key={filterType}
                    anchorEl={filterMenuAnchor[filterType]}
                    open={Boolean(filterMenuAnchor[filterType])}
                    onClose={() => handleFilterMenuClose(filterType)}
                >
                    {getFilterOptions(filterType).map((option) => (
                        <MenuItem
                            key={option}
                            onClick={() =>
                                handleFilterSelect(filterType, option)
                            }
                            selected={activeFilters[filterType] === option}
                        >
                            {option}
                        </MenuItem>
                    ))}
                </Menu>
            ))}

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
                        filters={activeFilters}
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
                        {filteredJobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredJobs.map((job) => (
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

JobTable.propTypes = {
    jobs: PropTypes.arrayOf(
        PropTypes.shape({
            metadata: PropTypes.shape({
                name: PropTypes.string.isRequired,
                namespace: PropTypes.string.isRequired,
            }).isRequired,
            status: PropTypes.shape({
                state: PropTypes.shape({
                    phase: PropTypes.string,
                }),
            }),
            spec: PropTypes.shape({
                queue: PropTypes.string,
            }),
        }),
    ).isRequired,
    handleJobClick: PropTypes.func.isRequired,
    uniqueStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    allQueues: PropTypes.arrayOf(PropTypes.string).isRequired,
    anchorEl: PropTypes.object,
    handleFilterClick: PropTypes.func.isRequired,
    handleFilterClose: PropTypes.func.isRequired,
    sortDirection: PropTypes.string.isRequired,
    toggleSortDirection: PropTypes.func.isRequired,
    onJobUpdate: PropTypes.func,
    reloadJobs: PropTypes.func,
};

export default JobTable;
