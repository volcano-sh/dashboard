import React, { useMemo, useState } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    useTheme,
    alpha,
    TableHead,
    Typography,
    Box,
    IconButton,
} from "@mui/material";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getSortedRowModel,
    getFilteredRowModel,
} from "@tanstack/react-table";
import { Edit, Delete, ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";
import JobStatusChip from "../JobStatusChip";
import JobEditDialog from "./JobEditDialog";
import JobTableDeleteDialog from "./JobTableDeleteDialog";
import TableFilterMenu from "../../TableFilterMenu";

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

    // State for dialogs
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState(null);

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
                if (contentType && contentType.includes("application/json") && text) {
                    data = JSON.parse(text);
                } else {
                    data = { message: text };
                }
            } catch {
                data = { message: text };
            }

            if (!response.ok) {
                const k8sMessage = data.message || data.details || text || `Job "${namespace}/${name}" could not be deleted.`;
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

    const handleOpenEditDialog = (job, e) => {
        e.stopPropagation();
        setJobToEdit(job);
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setJobToEdit(null);
    };

    const handleSaveJob = (updatedJob) => {
        onJobUpdate(updatedJob);
        handleCloseEditDialog();
    };

    // Columns definition for TanStack Table
    const columns = useMemo(
        () => [
            {
                header: "Name",
                accessorKey: "metadata.name",
                cell: ({ row }) => (
                    <Typography fontWeight={600} color="text.primary" letterSpacing="0.01em">
                        {row.original.metadata.name}
                    </Typography>
                ),
            },
            {
                header: "Namespace",
                accessorKey: "metadata.namespace",
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500}>
                        {row.original.metadata.namespace}
                    </Typography>
                ),
            },
            {
                header: "Queue",
                accessorKey: "spec.queue",
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500}>
                        {row.original.spec.queue || "N/A"}
                    </Typography>
                ),
            },
            {
                header: "Creation Time",
                accessorKey: "metadata.creationTimestamp",
                cell: ({ row }) => (
                    <Typography variant="body2" color={alpha(theme.palette.text.primary, 0.85)}>
                        {new Date(row.original.metadata.creationTimestamp).toLocaleString()}
                    </Typography>
                ),
            },
            {
                header: "Status",
                accessorKey: "status.state.phase",
                cell: ({ row }) => (
                    <Box
                        sx={{
                            display: "inline-block",
                            transition: "all 0.3s ease",
                            "&:hover": {
                                transform: "translateY(-2px)",
                                filter: "brightness(1.05)",
                            },
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                            borderRadius: "15px",
                        }}
                    >
                        <JobStatusChip
                            status={row.original.status ? row.original.status.state.phase : "Unknown"}
                            sx={{
                                height: "30px",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                padding: "0 12px",
                                color: "common.white",
                                borderRadius: "15px",
                            }}
                        />
                    </Box>
                ),
            },
            {
                header: "Actions",
                id: "actions",
                cell: ({ row }) => (
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton
                            onClick={(e) => handleOpenEditDialog(row.original, e)}
                            size="small"
                            sx={{
                                color: theme.palette.primary.main,
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                },
                            }}
                        >
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(row.original);
                            }}
                            size="small"
                            sx={{
                                color: theme.palette.error.main,
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                },
                            }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [theme],
    );

    const table = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

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
                    "&::-webkit-scrollbar": { width: "10px", height: "10px" },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: "5px",
                        "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.3) },
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: "5px",
                    },
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const isFilterable = ["Namespace", "Queue", "Status"].includes(header.column.columnDef.header);
                                    const isSortable = header.column.columnDef.header === "Creation Time";
                                    
                                    return (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                                backdropFilter: "blur(8px)",
                                                padding: "16px 24px",
                                                minWidth: 140,
                                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            }}
                                        >
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </Typography>
                                                    {isFilterable && (
                                                        <TableFilterMenu
                                                            filterType={header.column.columnDef.header.toLowerCase()}
                                                            currentValue={filters[header.column.columnDef.header.toLowerCase()]}
                                                            options={
                                                                header.column.columnDef.header === "Namespace"
                                                                    ? allNamespaces
                                                                    : header.column.columnDef.header === "Queue"
                                                                    ? allQueues
                                                                    : uniqueStatuses
                                                            }
                                                            handleFilterClick={handleFilterClick}
                                                            handleFilterClose={handleFilterClose}
                                                            anchorEl={anchorEl[header.column.columnDef.header.toLowerCase()]}
                                                        />
                                                    )}
                                                </Box>
                                                {isSortable && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={toggleSortDirection}
                                                        sx={{
                                                            alignSelf: "flex-start",
                                                            borderRadius: "20px",
                                                            padding: "4px 12px",
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                            color: theme.palette.primary.main,
                                                            "&:hover": {
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                                                transform: "translateY(-2px)",
                                                            },
                                                        }}
                                                    >
                                                        {sortDirection === "desc" ? (
                                                            <ArrowDownward fontSize="small" sx={{ mr: 1 }} />
                                                        ) : sortDirection === "asc" ? (
                                                            <ArrowUpward fontSize="small" sx={{ mr: 1 }} />
                                                        ) : (
                                                            <UnfoldMore fontSize="small" sx={{ mr: 1 }} />
                                                        )}
                                                        <Typography variant="caption" fontWeight={600}>Sort</Typography>
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    hover
                                    onClick={() => handleJobClick(row.original)}
                                    sx={{
                                        height: "60px",
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        "&:hover": {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            "& .MuiTableCell-root": { color: theme.palette.primary.main },
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                                            transform: "translateY(-2px)",
                                        },
                                        cursor: "pointer",
                                        "& td": { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} sx={{ padding: "16px 24px" }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {jobToEdit && (
                <JobEditDialog
                    open={isEditDialogOpen}
                    job={jobToEdit}
                    onClose={handleCloseEditDialog}
                    onSave={handleSaveJob}
                />
            )}

            <JobTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDelete}
                jobToDelete={jobToDelete ? `${jobToDelete.metadata.namespace}/${jobToDelete.metadata.name}` : ""}
                error={deleteError}
                isDeleting={isDeleting}
            />
        </React.Fragment>
    );
};

export default JobTable;
