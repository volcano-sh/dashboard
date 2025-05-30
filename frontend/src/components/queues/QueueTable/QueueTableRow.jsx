
import React, { useState } from "react";
import PropTypes from "prop-types";
import { TableRow, TableCell, Box, Chip, useTheme, alpha } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import EditQueueDialog from "./EditQueueDialog";

const QueueTableRow = ({
    queue,
    allocatedFields,
    handleQueueClick,
    handleOpenDeleteDialog,
    onQueueUpdate,
    visibleColumns,
}) => {
    const theme = useTheme();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const getStateColor = (status) => {
        switch (status) {
            case "Open":
                return theme.palette.success.main;
            case "Closing":
                return theme.palette.warning.main;
            case "Closed":
                return theme.palette.info.main;
            default:
                return theme.palette.grey[500];
        }
    };

    const handleOpenEditDialog = () => {
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
    };

    const handleSaveQueue = (updatedQueue) => {
        onQueueUpdate(updatedQueue);
    };

    return (
        <>
            <TableRow
                hover
                onClick={(e) => {
                    if (!e.target.closest("button")) {
                        handleQueueClick(queue);
                    }
                }}
                sx={{
                    height: "60px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        "& .MuiTableCell-root": {
                            color: theme.palette.primary.main,
                        },
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        transform: "translateY(-2px)",
                    },
                    cursor: "pointer",
                    "&:last-child td, &:last-child th": {
                        borderBottom: 0,
                    },
                    "& td": {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    },
                }}
            >
                {visibleColumns.name && (
                    <TableCell
                        sx={{
                            padding: "16px 24px",
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            letterSpacing: "0.01em",
                        }}
                    >
                        {queue.metadata.name}
                    </TableCell>
                )}

                {visibleColumns.allocatedCpu && (
                    <TableCell
                        sx={{
                            padding: "16px 24px",
                            fontFamily: theme.typography.fontFamily,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                        }}
                    >
                        {queue.status?.allocated?.cpu || "0"}
                    </TableCell>
                )}

                {visibleColumns.allocatedMemory && (
                    <TableCell
                        sx={{
                            padding: "16px 24px",
                            fontFamily: theme.typography.fontFamily,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                        }}
                    >
                        {queue.status?.allocated?.memory || "0"}
                    </TableCell>
                )}

                {visibleColumns.allocatedPods && (
                    <TableCell
                        sx={{
                            padding: "16px 24px",
                            fontFamily: theme.typography.fontFamily,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                        }}
                    >
                        {queue.status?.allocated?.pods || "0"}
                    </TableCell>
                )}

                {visibleColumns.creationTime && (
                    <TableCell
                        sx={{
                            padding: "16px 24px",
                            fontSize: "0.9rem",
                            color: alpha(theme.palette.text.primary, 0.85),
                        }}
                    >
                        {new Date(
                            queue.metadata.creationTimestamp,
                        ).toLocaleString()}
                    </TableCell>
                )}

                {visibleColumns.state && (
                    <TableCell sx={{ padding: "16px 24px" }}>
                        <Chip
                            label={
                                queue.status ? queue.status.state : "Unknown"
                            }
                            sx={{
                                bgcolor: getStateColor(
                                    queue.status
                                        ? queue.status.state
                                        : "Unknown",
                                ),
                                color: "common.white",
                                height: "30px",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                letterSpacing: "0.02em",
                                borderRadius: "15px",
                                boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                                padding: "0 12px",
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)",
                                    filter: "brightness(1.05)",
                                },
                            }}
                        />
                    </TableCell>
                )}

                {visibleColumns.actions && (
                    <TableCell sx={{ padding: "16px 24px" }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditDialog();
                                }}
                                size="small"
                                sx={{
                                    color: theme.palette.primary.main,
                                    "&:hover": {
                                        backgroundColor: alpha(
                                            theme.palette.primary.main,
                                            0.1,
                                        ),
                                    },
                                }}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeleteDialog(queue.metadata.name);
                                }}
                                size="small"
                                sx={{
                                    color: theme.palette.error.main,
                                    "&:hover": {
                                        backgroundColor: alpha(
                                            theme.palette.error.main,
                                            0.1,
                                        ),
                                    },
                                }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    </TableCell>
                )}
            </TableRow>

            <EditQueueDialog
                open={isEditDialogOpen}
                queue={queue}
                onClose={handleCloseEditDialog}
                onSave={handleSaveQueue}
            />
        </>
    );
};

QueueTableRow.propTypes = {
    queue: PropTypes.shape({
        metadata: PropTypes.shape({
            name: PropTypes.string.isRequired,
            namespace: PropTypes.string,
            creationTimestamp: PropTypes.string.isRequired,
        }).isRequired,
        status: PropTypes.shape({
            state: PropTypes.string,
            allocated: PropTypes.shape({
                cpu: PropTypes.string,
                memory: PropTypes.string,
                pods: PropTypes.string,
            }),
        }),
    }).isRequired,
    allocatedFields: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleQueueClick: PropTypes.func.isRequired,
    handleOpenDeleteDialog: PropTypes.func.isRequired,
    onQueueUpdate: PropTypes.func,
    visibleColumns: PropTypes.shape({
        name: PropTypes.bool.isRequired,
        allocatedCpu: PropTypes.bool.isRequired,
        allocatedMemory: PropTypes.bool.isRequired,
        allocatedPods: PropTypes.bool.isRequired,
        creationTime: PropTypes.bool.isRequired,
        state: PropTypes.bool.isRequired,
        actions: PropTypes.bool.isRequired,
    }).isRequired,
};

export default QueueTableRow;
