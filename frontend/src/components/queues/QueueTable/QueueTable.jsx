import React, { useState, useMemo, useCallback } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
    TableHead,
    Typography,
    Box,
    Chip,
    IconButton,
} from "@mui/material";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getSortedRowModel,
    getFilteredRowModel,
} from "@tanstack/react-table";
import { Delete, Edit, ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";
import TableFilterMenu from "../../TableFilterMenu";
import QueueTableDeleteDialog from "./QueueTableDeleteDialog";
import EditQueueDialog from "./EditQueueDialog";

const QueueTable = ({
    sortedQueues,
    allocatedFields,
    handleQueueClick,
    handleSort,
    sortConfig,
    filters,
    handleFilterClick,
    anchorEl,
    uniqueStates,
    handleFilterClose,
    setAnchorEl,
    onQueueUpdate,
}) => {
    const theme = useTheme();

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [queueToEdit, setQueueToEdit] = useState(null);

    const handleOpenDeleteDialog = (queueName) => {
        setQueueToDelete(queueName);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQueueToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/queues/${encodeURIComponent(queueToDelete)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
            });

            let data = {};
            const contentType = response.headers.get("content-type");
            const text = await response.text();

            try {
                if ((contentType && contentType.includes("application/json")) || (text && !text.trim().startsWith("<"))) {
                    data = text ? JSON.parse(text) : {};
                }
            } catch (parseError) {
                console.warn("Failed to parse response as JSON:", parseError);
            }

            if (!response.ok) {
                let customMessage = data.message || data.details || `queues.scheduling.volcano.sh "${queueToDelete}" is forbidden.`;
                throw new Error(`Cannot delete "${queueToDelete}". Error message: ${customMessage}`);
            }

            handleCloseDeleteDialog();
            // Note: Parent should handle the list update via refetch or state update
        } catch (error) {
            setDeleteError(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenEditDialog = (queue, e) => {
        e.stopPropagation();
        setQueueToEdit(queue);
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setQueueToEdit(null);
    };

    const getStateColor = useCallback((status) => {
        switch (status) {
            case "Open": return theme.palette.success.main;
            case "Closing": return theme.palette.warning.main;
            case "Closed": return theme.palette.info.main;
            default: return theme.palette.grey[500];
        }
    }, [theme]);

    const columns = useMemo(() => {
        const cols = [
            {
                header: "Name",
                accessorKey: "metadata.name",
                cell: ({ row }) => (
                    <Typography fontWeight={600} color="text.primary" letterSpacing="0.01em">
                        {row.original.metadata.name}
                    </Typography>
                ),
            },
        ];

        allocatedFields.forEach(field => {
            cols.push({
                header: field.charAt(0).toUpperCase() + field.slice(1),
                accessorKey: `status.allocated.${field}`,
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.original.status?.allocated?.[field] || "0"}
                    </Typography>
                ),
            });
        });

        cols.push(
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
                accessorKey: "status.state",
                cell: ({ row }) => (
                    <Chip
                        label={row.original.status ? row.original.status.state : "Unknown"}
                        sx={{
                            bgcolor: getStateColor(row.original.status ? row.original.status.state : "Unknown"),
                            color: "common.white",
                            height: "30px",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            borderRadius: "15px",
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                            padding: "0 12px",
                            "&:hover": { transform: "translateY(-2px)", filter: "brightness(1.05)" },
                        }}
                    />
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
                                "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                            }}
                        >
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(row.original.metadata.name);
                            }}
                            size="small"
                            sx={{
                                color: theme.palette.error.main,
                                "&:hover": { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                            }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Box>
                ),
            }
        );

        return cols;
    }, [theme, allocatedFields, getStateColor]);

    const table = useReactTable({
        data: sortedQueues,
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
                    },
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const headerText = header.column.columnDef.header;
                                    const isSortable = ["Name", "Creation Time"].includes(headerText) || allocatedFields.includes(headerText.toLowerCase());
                                    const isFilterable = headerText === "Status";

                                    return (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                                backdropFilter: "blur(8px)",
                                                padding: "16px 24px",
                                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            }}
                                        >
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                                                        {flexRender(headerText, header.getContext())}
                                                    </Typography>
                                                    {isFilterable && (
                                                        <TableFilterMenu
                                                            filterType="status"
                                                            currentValue={filters.status}
                                                            options={uniqueStates}
                                                            handleFilterClick={handleFilterClick}
                                                            handleFilterClose={handleFilterClose}
                                                            anchorEl={anchorEl.status}
                                                        />
                                                    )}
                                                </Box>
                                                {isSortable && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleSort(headerText === "Creation Time" ? "creationTimestamp" : headerText.toLowerCase())}
                                                        sx={{
                                                            alignSelf: "flex-start",
                                                            borderRadius: "20px",
                                                            padding: "4px 12px",
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                            color: theme.palette.primary.main,
                                                            "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
                                                        }}
                                                    >
                                                        {sortConfig.key === (headerText === "Creation Time" ? "creationTimestamp" : headerText.toLowerCase()) ? (
                                                            sortConfig.direction === "desc" ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />
                                                        ) : (
                                                            <UnfoldMore fontSize="small" />
                                                        )}
                                                        <Typography variant="caption" fontWeight={600} sx={{ ml: 1 }}>Sort</Typography>
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
                                    No queues found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    hover
                                    onClick={() => handleQueueClick(row.original)}
                                    sx={{
                                        height: "60px",
                                        transition: "all 0.3s ease",
                                        "&:hover": {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            transform: "translateY(-2px)",
                                        },
                                        cursor: "pointer",
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

            {queueToEdit && (
                <EditQueueDialog
                    open={isEditDialogOpen}
                    queue={queueToEdit}
                    onClose={handleCloseEditDialog}
                    onSave={onQueueUpdate}
                />
            )}

            <QueueTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDelete}
                queueToDelete={queueToDelete}
                error={deleteError}
                isDeleting={isDeleting}
            />
        </React.Fragment>
    );
};

export default QueueTable;
