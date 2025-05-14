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
import EmptyState from "../../common/EmptyState";

const QueueTable = ({
    sortedQueues = [],
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
    handleDelete,
    onRefresh,
}) => {
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);

    const handleOpenDeleteDialog = (queueName) => {
        setQueueToDelete(queueName);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQueueToDelete(null);
    };

    const confirmDelete = () => {
        if (handleDelete && queueToDelete) {
            handleDelete(queueToDelete);
        }
        handleCloseDeleteDialog();
    };

    // Check if filters are applied
    const hasFilters = Object.entries(filters).some(([key, value]) => {
        // Skip 'All' values or empty values
        return value !== "All" && value !== "";
    });

    // Handle clearing all filters
    const handleClearFilters = () => {
        // Reset all filters to 'All' or empty
        Object.keys(filters).forEach((key) => {
            handleFilterClose(key, "All");
        });
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
                        {sortedQueues.length > 0 ? (
                            sortedQueues.map((queue) => (
                                <QueueTableRow
                                    key={queue.metadata.name}
                                    queue={queue}
                                    allocatedFields={allocatedFields}
                                    handleQueueClick={handleQueueClick}
                                    handleOpenDeleteDialog={
                                        handleOpenDeleteDialog
                                    }
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="100%">
                                    <EmptyState
                                        resourceType="Queue"
                                        hasFilters={hasFilters}
                                        onClearFilters={handleClearFilters}
                                        onRefresh={onRefresh}
                                        customMessages={{
                                            noDataDescription:
                                                "There are currently no queues configured in the cluster.",
                                            noMatchDescription:
                                                "No queues match your current filter criteria. Try adjusting your filters to see more results.",
                                        }}
                                    />
                                </td>
                            </tr>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <QueueTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={confirmDelete}
                queueToDelete={queueToDelete}
            />
        </React.Fragment>
    );
};

export default QueueTable;
