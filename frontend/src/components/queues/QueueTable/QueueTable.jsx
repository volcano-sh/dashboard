import React, { useState, useEffect, useCallback } from "react";
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
    IconButton,
    Popover,
} from "@mui/material";
import { ViewColumn } from "@mui/icons-material";
import QueueTableHeader from "./QueueTableHeader";
import QueueTableRow from "./QueueTableRow";
import QueueTableDeleteDialog from "./QueueTableDeleteDialog";
import ColumnVisibilityFilter from "../../filters/ColumnVisibilityFilter";

const COLUMNS = [
    { key: "name", label: "Name" },
    { key: "allocatedCpu", label: "Allocated CPU" },
    { key: "allocatedMemory", label: "Allocated Memory" },
    { key: "creationTime", label: "Creation Time" },
    { key: "state", label: "State" },
    { key: "actions", label: "Actions" },
];

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
    onQueueUpdate,
}) => {
    const theme = useTheme();


    const [queues, setQueues] = useState(sortedQueues);
    const [columnFilterAnchor, setColumnFilterAnchor] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState(() =>
        COLUMNS.reduce(
            (acc, col) => ({
                ...acc,
                [col.key]: true,
            }),
            {},
        ),
    );

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setQueues(sortedQueues || []);
    }, [sortedQueues]);

    const handleOpenDeleteDialog = useCallback((queueName) => {
        setQueueToDelete(queueName);
        setOpenDeleteDialog(true);
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        setOpenDeleteDialog(false);
        setQueueToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    }, []);

    const handleColumnToggle = useCallback((columnKey, isVisible) => {
        setVisibleColumns((prev) => ({
            ...prev,
            [columnKey]: isVisible,
        }));
    }, []);

    const handleDelete = useCallback(async () => {
        try {
            setIsDeleting(true);

            const response = await fetch(
                `/api/queues/${encodeURIComponent(queueToDelete)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            handleCloseDeleteDialog();
            const updatedQueues = queues.filter(
                (q) => q.metadata.name !== queueToDelete,
            );
            setQueues(updatedQueues);
            if (onQueueUpdate) {
                onQueueUpdate(updatedQueues);
            }
        } catch (error) {
            console.error("Error deleting queue:", error);
            setDeleteError(error.message);
        } finally {
            setIsDeleting(false);
        }
    }, [queueToDelete, handleCloseDeleteDialog, queues, onQueueUpdate]);

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
                    position: "relative",
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
                <IconButton
                    onClick={(e) => setColumnFilterAnchor(e.currentTarget)}
                    sx={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        zIndex: 1000,
                    }}
                >
                    <ViewColumn />
                </IconButton>

                <Popover
                    open={Boolean(columnFilterAnchor)}
                    anchorEl={columnFilterAnchor}
                    onClose={() => setColumnFilterAnchor(null)}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                >
                    <ColumnVisibilityFilter
                        columns={COLUMNS}
                        visibleColumns={visibleColumns}
                        onColumnToggle={handleColumnToggle}
                    />
                </Popover>

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
                        visibleColumns={visibleColumns}
                    />
                    <TableBody>
                        {!Array.isArray(queues) || queues.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        Object.values(visibleColumns).filter(
                                            Boolean,
                                        ).length
                                    }
                                    align="center"
                                >
                                    No queues found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            queues.map(
                                (queue) =>
                                    queue &&
                                    queue.metadata && (
                                        <QueueTableRow
                                            key={queue.metadata.name}
                                            queue={queue}
                                            allocatedFields={allocatedFields}
                                            handleQueueClick={handleQueueClick}
                                            handleOpenDeleteDialog={
                                                handleOpenDeleteDialog
                                            }
                                            onQueueUpdate={onQueueUpdate}
                                            visibleColumns={visibleColumns}
                                        />
                                    ),
                            )
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

QueueTable.propTypes = {
    sortedQueues: PropTypes.arrayOf(
        PropTypes.shape({
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
        }),
    ).isRequired,
    allocatedFields: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleQueueClick: PropTypes.func.isRequired,
    handleSort: PropTypes.func.isRequired,
    sortConfig: PropTypes.shape({
        field: PropTypes.string,
        direction: PropTypes.string,
    }).isRequired,
    filters: PropTypes.object.isRequired,
    handleFilterClick: PropTypes.func.isRequired,
    anchorEl: PropTypes.object.isRequired,
    uniqueStates: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleFilterClose: PropTypes.func.isRequired,
    setAnchorEl: PropTypes.func.isRequired,
    onQueueUpdate: PropTypes.func,
};

export default QueueTable;
