import React from "react";
import { TableRow, TableCell, Box, useTheme, alpha } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import SchedulingStatusChip from "../../scheduling/SchedulingStatusChip";
import {
    tableNameSx,
    tableNumericSx,
    tableTimestampSx,
} from "../../scheduling/tableDataStyles";

const QueueTableRow = ({
    queue,
    allocatedFields,
    handleQueueClick,
    handleOpenDeleteDialog,
}) => {
    const theme = useTheme();

    return (
        <>
            <TableRow
                hover
                onClick={(e) => {
                    if (!(e.target as Element).closest("button")) {
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
                <TableCell
                    sx={{
                        padding: "16px 24px",
                        color: theme.palette.text.primary,
                        ...tableNameSx,
                    }}
                >
                    {queue.metadata.name}
                </TableCell>

                {allocatedFields.map((field) => (
                    <TableCell
                        key={field}
                        sx={{
                            padding: "16px 24px",
                            ...tableNumericSx,
                        }}
                    >
                        {queue.status?.allocated?.[field] || "0"}
                    </TableCell>
                ))}

                <TableCell
                    sx={{
                        padding: "16px 24px",
                        color: alpha(theme.palette.text.primary, 0.85),
                        ...tableTimestampSx,
                    }}
                >
                    {new Date(
                        queue.metadata.creationTimestamp,
                    ).toLocaleString()}
                </TableCell>

                <TableCell sx={{ padding: "16px 24px" }}>
                    <SchedulingStatusChip
                        minWidth={78}
                        size="medium"
                        status={queue.status ? queue.status.state : "Unknown"}
                    />
                </TableCell>

                <TableCell sx={{ padding: "16px 24px" }}>
                    <Box display="flex" alignItems="center" gap={2}>
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
            </TableRow>
        </>
    );
};

export default QueueTableRow;
