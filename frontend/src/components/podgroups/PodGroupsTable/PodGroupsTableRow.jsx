import React from "react";
import { TableRow, TableCell, Box, useTheme, alpha } from "@mui/material";
import JobStatusChip from "../../jobs/JobStatusChip"; // Reuse chip
import { translations } from "../../../config/translations";

const PodGroupsTableRow = ({ podGroup, handlePodGroupClick }) => {
    const theme = useTheme();

    const queueLabel = podGroup.spec.queue || translations.zh.unknown;
    const minMemberLabel =
        podGroup.spec.minMember != null
            ? podGroup.spec.minMember
            : translations.zh.unknown;
    const rawStatus = podGroup.status?.phase || "Unknown";

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
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    letterSpacing: "0.01em",
                }}
            >
                {podGroup.metadata.name}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                }}
            >
                {podGroup.metadata.namespace}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                }}
            >
                {queueLabel}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                }}
            >
                {minMemberLabel}
            </TableCell>

            <TableCell
                sx={{
                    padding: "16px 24px",
                    fontSize: "0.9rem",
                    color: alpha(theme.palette.text.primary, 0.85),
                }}
            >
                {new Date(podGroup.metadata.creationTimestamp).toLocaleString("zh-CN")}
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
                        status={rawStatus}
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
        </TableRow>
    );
};

export default PodGroupsTableRow;
