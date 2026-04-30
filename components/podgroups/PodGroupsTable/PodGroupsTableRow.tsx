import React from "react";
import { TableRow, TableCell, useTheme, alpha } from "@mui/material";
import SchedulingStatusChip from "../../scheduling/SchedulingStatusChip";
import {
    tableIdentifierSx,
    tableNameSx,
    tableNumericSx,
    tableTimestampSx,
} from "../../scheduling/tableDataStyles";

const PodGroupsTableRow = ({ podGroup, handlePodGroupClick }) => {
    const theme = useTheme();

    return (
        <TableRow
            hover
            onClick={() => handlePodGroupClick(podGroup)}
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
                {podGroup.metadata.name}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontWeight: 500,
                    ...tableIdentifierSx,
                }}
            >
                {podGroup.metadata.namespace}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontWeight: 500,
                    ...tableIdentifierSx,
                }}
            >
                {podGroup.spec.queue || "N/A"}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontWeight: 500,
                    ...tableNumericSx,
                }}
            >
                {podGroup.spec.minMember || "N/A"}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    color: alpha(theme.palette.text.primary, 0.85),
                    ...tableTimestampSx,
                }}
            >
                {new Date(podGroup.metadata.creationTimestamp).toLocaleString()}
            </TableCell>

            <TableCell sx={{ padding: "16px 24px" }}>
                <SchedulingStatusChip
                    minWidth={86}
                    size="medium"
                    status={podGroup.status ? podGroup.status.phase : "Unknown"}
                />
            </TableCell>
        </TableRow>
    );
};

export default PodGroupsTableRow;
