import React, { useState, useEffect } from "react";
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
import QueueTableHeader from "./QueueTableHeader";
import QueueTableRow from "./QueueTableRow";
import QueueTableDeleteDialog from "./QueueTableDeleteDialog";
import apiClient, { API_ENDPOINTS } from "../../config/api";

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

    const [queues, setQueues] = useState([]);

    useEffect(() => {
        setQueues(sortedQueues);
    }, [sortedQueues]);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

            await apiClient.delete(
                `${API_ENDPOINTS.queues.list}/${encodeURIComponent(queueToDelete)}`
            );

            setQueues((prev) =>
                prev.filter((queue) => queue.metadata.name !== queueToDelete),
            );
            handleCloseDeleteDialog();
        } catch (error) {
            console.error("Error deleting queue:", error);
            const data = error.response?.data;
            const customMessage =
                data?.message ||
                data?.details ||
                error.message ||
                `queues.scheduling.volcano.sh "${queueToDelete}" is forbidden.`;
            const fullMessage = `Cannot delete "${queueToDelete}". Error message: ${customMessage}`;
            setDeleteError(fullMessage);
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
                        {queues.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={allocatedFields.length + 2}
                                    align="center"
                                >
                                    No queues found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            queues.map((queue) => (
                                <QueueTableRow
                                    key={queue.metadata.name}
                                    queue={queue}
                                    allocatedFields={allocatedFields}
                                    handleQueueClick={handleQueueClick}
                                    handleOpenDeleteDialog={
                                        handleOpenDeleteDialog
                                    }
                                    onQueueUpdate={onQueueUpdate}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
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