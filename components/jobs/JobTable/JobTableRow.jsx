import React, { useState } from "react";
import {
    TableRow,
    TableCell,
    Box,
    IconButton,
    useTheme,
    alpha,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import JobStatusChip from "../JobStatusChip";
import JobEditDialog from "./JobEditDialog";

const JobTableRow = ({
    job,
    handleJobClick,
    handleOpenDeleteDialog,
    onJobUpdate, // Function to update job after edit
}) => {
    const theme = useTheme();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleOpenEditDialog = (e) => {
        e.stopPropagation();
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
    };

    const handleSaveJob = (updatedJob) => {
        onJobUpdate(updatedJob);
        handleCloseEditDialog();
    };

    return (
        <>
            <TableRow
                hover
                onClick={() => handleJobClick(job)}
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
                <TableCell
                    sx={{
                        padding: "16px 24px",
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        letterSpacing: "0.01em",
                    }}
                >
                    {job.metadata.name}
                </TableCell>

                <TableCell
                    sx={{
                        padding: "16px 24px",
                        fontWeight: 500,
                        fontSize: "0.95rem",
                    }}
                >
                    {job.metadata.namespace}
                </TableCell>

                <TableCell
                    sx={{
                        padding: "16px 24px",
                        fontWeight: 500,
                        fontSize: "0.95rem",
                    }}
                >
                    {job.spec.queue || "N/A"}
                </TableCell>

                <TableCell
                    sx={{
                        padding: "16px 24px",
                        fontSize: "0.9rem",
                        color: alpha(theme.palette.text.primary, 0.85),
                    }}
                >
                    {new Date(job.metadata.creationTimestamp).toLocaleString()}
                </TableCell>

                <TableCell sx={{ padding: "16px 24px" }}>
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
                            status={
                                job.status ? job.status.state.phase : "Unknown"
                            }
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
                </TableCell>

                <TableCell sx={{ padding: "16px 24px" }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton
                            onClick={handleOpenEditDialog}
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
                                handleOpenDeleteDialog(job);
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
            </TableRow>

            {/* Edit Dialog */}
            <JobEditDialog
                open={isEditDialogOpen}
                job={job}
                onClose={handleCloseEditDialog}
                onSave={handleSaveJob}
            />
        </>
    );
};

export default JobTableRow;
