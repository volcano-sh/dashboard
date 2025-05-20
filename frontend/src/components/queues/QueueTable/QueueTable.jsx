import React, { useState } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
    alpha,
} from "@mui/material";
import QueueTableHeader from "./QueueTableHeader";
import QueueTableRow from "./QueueTableRow";
import QueueTableDeleteDialog from "./QueueTableDeleteDialog";

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
<<<<<<< HEAD
    onDelete, // Prop for handling queue deletion
    onQueueUpdate, // Prop for handling queue updates
=======
    handleDelete,
>>>>>>> main
}) => {
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
<<<<<<< HEAD
    const [deleteError, setDeleteError] = useState(null);

    const handleOpenDeleteDialog = (queueName) => {
        if (queueName.toLowerCase() === "default") {
            setDeleteError("The default queue cannot be deleted");
            setOpenDeleteDialog(true);
            return;
        }
=======

    const handleOpenDeleteDialog = (queueName) => {
>>>>>>> main
        setQueueToDelete(queueName);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQueueToDelete(null);
<<<<<<< HEAD
        setDeleteError(null);
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/queues/${queueToDelete}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.details || data.error || "Failed to delete queue",
                );
            }

            handleCloseDeleteDialog();
            if (onDelete) {
                onDelete(queueToDelete);
            }
        } catch (error) {
            console.error("Error deleting queue:", error);
            setDeleteError(error.message);
        }
=======
    };

    const confirmDelete = () => {
        if (handleDelete && queueToDelete) {
            handleDelete(queueToDelete);
        }
        handleCloseDeleteDialog();
>>>>>>> main
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
                    <QueueTableHeader
                        allocatedFields={allocatedFields}
                        handleSort={handleSort}
                        sortConfig={sortConfig}
                        filters={filters}
                        handleFilterClick={handleFilterClick}
                        anchorEl={anchorEl}
                        uniqueStates={uniqueStates}
                        handleFilterClose={handleFilterClose}
                        setAnchorEl={setAnchorEl}
                    />
                    <TableBody>
                        {sortedQueues.map((queue) => (
                            <QueueTableRow
                                key={queue.metadata.name}
                                queue={queue}
                                allocatedFields={allocatedFields}
                                handleQueueClick={handleQueueClick}
                                handleOpenDeleteDialog={handleOpenDeleteDialog}
<<<<<<< HEAD
                                onQueueUpdate={onQueueUpdate}
=======
>>>>>>> main
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <QueueTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
<<<<<<< HEAD
                onConfirm={handleDelete}
                queueToDelete={queueToDelete}
                error={deleteError}
=======
                onConfirm={confirmDelete}
                queueToDelete={queueToDelete}
>>>>>>> main
            />
        </React.Fragment>
    );
};

export default QueueTable;
