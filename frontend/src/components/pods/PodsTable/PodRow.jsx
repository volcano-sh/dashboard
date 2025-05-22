import React from "react";
import { TableRow, TableCell, Chip, useTheme, alpha } from "@mui/material";
import { calculateAge } from "../../utils";

const PodRow = ({ pod, getStatusColor, onPodClick }) => {
    const theme = useTheme();

    return (
        <TableRow
            hover
            onClick={(e) => onPodClick(pod)}
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
                {pod.metadata.name}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                }}
            >
                {pod.metadata.namespace}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontSize: "0.9rem",
                    color: alpha(theme.palette.text.primary, 0.85),
                }}
            >
                {new Date(pod.metadata.creationTimestamp).toLocaleString()}
            </TableCell>

            <TableCell sx={{ padding: "16px 24px" }}>
                <Chip
                    label={pod.status?.phase || "Unknown"}
                    sx={{
                        bgcolor: getStatusColor(pod.status?.phase || "Unknown"),
                        color: "common.white",
                        height: "30px",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        letterSpacing: "0.02em",
                        borderRadius: "15px",
                        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                        padding: "0 12px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)",
                            filter: "brightness(1.05)",
                        },
                    }}
                />
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                }}
            >
                {calculateAge(pod.metadata.creationTimestamp)}
            </TableCell>
        </TableRow>
    );
};

export default PodRow;
