import React from "react";
import { TableRow, TableCell, useTheme, alpha } from "@mui/material";
import { calculateAge } from "../../utils";
import {
    tableIdentifierSx,
    tableTimestampSx,
} from "../../scheduling/tableDataStyles";
import PodStatusChip from "../PodStatusChip";

const PodRow = ({ isSelected, pod, onPodClick }) => {
    const theme = useTheme();
    const selectedBg = alpha("#f97316", 0.08);

    return (
        <TableRow
            hover
            onClick={() => onPodClick(pod)}
            sx={{
                bgcolor: isSelected ? selectedBg : "#ffffff",
                height: 56,
                transition:
                    "background-color 0.2s ease, border-color 0.2s ease",
                "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
                cursor: "pointer",
                "&:last-child td, &:last-child th": {
                    borderBottom: 0,
                },
                "& td": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <TableCell
                sx={{
                    padding: "12px 18px",
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    ...tableIdentifierSx,
                }}
            >
                {pod.metadata.name}
            </TableCell>

            <TableCell
                sx={{
                    padding: "12px 18px",
                    ...tableIdentifierSx,
                }}
            >
                {pod.metadata.namespace}
            </TableCell>

            <TableCell
                sx={{
                    padding: "12px 18px",
                    color: alpha(theme.palette.text.primary, 0.85),
                    ...tableIdentifierSx,
                }}
            >
                {pod.summary?.queue || "N/A"}
            </TableCell>

            <TableCell
                sx={{
                    padding: "12px 18px",
                    color: alpha(theme.palette.text.primary, 0.85),
                    ...tableTimestampSx,
                }}
            >
                {new Date(pod.metadata.creationTimestamp).toLocaleString()}
            </TableCell>

            <TableCell sx={{ padding: "12px 18px" }}>
                <PodStatusChip status={pod.status?.phase || "Unknown"} />
            </TableCell>

            <TableCell
                sx={{
                    padding: "12px 18px",
                    ...tableTimestampSx,
                }}
            >
                {calculateAge(pod.metadata.creationTimestamp)}
            </TableCell>
        </TableRow>
    );
};

export default PodRow;
