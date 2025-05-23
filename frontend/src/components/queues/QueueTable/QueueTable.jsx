import React, { useState } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    useTheme,
    alpha,
    Skeleton,
} from "@mui/material";
import QueueTableHeader from "./QueueTableHeader";
import QueueTableRow from "./QueueTableRow";
import QueueTableDeleteDialog from "./QueueTableDeleteDialog";

// Skeleton Row Component for Queue Table
const QueueTableSkeletonRow = ({ allocatedFields }) => {
    return (
        <TableRow>
            <TableCell>
                <Skeleton variant="text" width="70%" height={24} />
            </TableCell>
            {allocatedFields.map((field) => (
                <TableCell key={field}>
                    <Skeleton variant="text" width="40%" height={24} />
                </TableCell>
            ))}
            <TableCell>
                <Skeleton variant="text" width="85%" height={24} />
            </TableCell>
            <TableCell>
                <Skeleton variant="rounded" width={70} height={28} />
            </TableCell>
            <TableCell>
                <div style={{ display: "flex", gap: "8px" }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="circular" width={24} height={24} />
                </div>
            </TableCell>
        </TableRow>
    );
};

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
    handleDelete,
    isLoading = false,
    skeletonRows = 5,
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
                        {isLoading
                            ? Array.from({ length: skeletonRows }).map((_, index) => (
                                  <QueueTableSkeletonRow 
                                      key={`skeleton-${index}`}
                                      allocatedFields={allocatedFields}
                                  />
                              ))
                            : sortedQueues.map((queue) => (
                                  <QueueTableRow
                                      key={queue.metadata.name}
                                      queue={queue}
                                      allocatedFields={allocatedFields}
                                      handleQueueClick={handleQueueClick}
                                      handleOpenDeleteDialog={handleOpenDeleteDialog}
                                  />
                              ))}
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