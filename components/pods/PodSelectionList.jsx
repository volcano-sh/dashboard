import React from "react";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { alpha } from "@mui/material/styles";
import {
    tableIdentifierSx,
    tableTimestampSx,
} from "../scheduling/tableDataStyles";

const PodSelectionList = ({
    onPodClick,
    pods,
    selectedPod,
    sortDirection,
    onSortDirectionToggle,
}) => {
    const sortedPods = React.useMemo(
        () =>
            [...pods].sort((a, b) => {
                const compareResult =
                    new Date(b.metadata.creationTimestamp) -
                    new Date(a.metadata.creationTimestamp);
                return sortDirection === "desc"
                    ? compareResult
                    : -compareResult;
            }),
        [pods, sortDirection],
    );

    return (
        <Paper
            sx={{
                border: "1px solid #dfe3e8",
                borderRadius: 1.5,
                boxShadow: "none",
                overflow: "hidden",
                width: "100%",
            }}
        >
            <TableContainer
                sx={{
                    maxHeight: "calc(100vh - 250px)",
                    overflowX: "hidden",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                        width: "8px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#d7dce1",
                        borderRadius: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f8fafc",
                    },
                }}
            >
                <Table size="small" sx={{ tableLayout: "fixed", width: 236 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    alignItems: "center",
                                    bgcolor: "#fafbfc",
                                    borderBottom: "1px solid #dfe3e8",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    px: 1.75,
                                    py: 1.25,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    Name
                                </Typography>
                                <Typography
                                    onClick={onSortDirectionToggle}
                                    sx={{
                                        color: "text.secondary",
                                        cursor: "pointer",
                                        fontSize: 11.5,
                                        userSelect: "none",
                                    }}
                                >
                                    {sortDirection === "desc"
                                        ? "Newest"
                                        : "Oldest"}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedPods.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    sx={{
                                        color: "text.secondary",
                                        px: 2,
                                        py: 4,
                                        textAlign: "center",
                                    }}
                                >
                                    No pods found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedPods.map((pod) => {
                                const selected =
                                    selectedPod?.metadata?.namespace ===
                                        pod.metadata.namespace &&
                                    selectedPod?.metadata?.name ===
                                        pod.metadata.name;

                                return (
                                    <TableRow
                                        hover
                                        key={`${pod.metadata.namespace}-${pod.metadata.name}`}
                                        onClick={() => onPodClick(pod)}
                                        sx={{
                                            bgcolor: selected
                                                ? alpha("#f97316", 0.08)
                                                : "#ffffff",
                                            cursor: "pointer",
                                            position: "relative",
                                            "&::before": selected
                                                ? {
                                                      bgcolor: "#f97316",
                                                      bottom: 0,
                                                      content: '""',
                                                      left: 0,
                                                      position: "absolute",
                                                      top: 0,
                                                      width: 2.5,
                                                  }
                                                : undefined,
                                            "& td": {
                                                borderBottom:
                                                    "1px solid rgba(0, 0, 0, 0.08)",
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ px: 1.75, py: 1.4 }}>
                                            <Box
                                                sx={{
                                                    alignItems: "center",
                                                    display: "flex",
                                                    gap: 1.25,
                                                    minWidth: 0,
                                                }}
                                            >
                                                <Inventory2OutlinedIcon
                                                    sx={{
                                                        color: "text.secondary",
                                                        fontSize: 15,
                                                    }}
                                                />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        sx={{
                                                            color: "text.primary",
                                                            fontSize: 12,
                                                            fontWeight: selected
                                                                ? 700
                                                                : 500,
                                                            lineHeight: 1.4,
                                                            overflowWrap:
                                                                "anywhere",
                                                            ...tableIdentifierSx,
                                                        }}
                                                    >
                                                        {pod.metadata.name}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            color: "text.secondary",
                                                            fontSize: 11,
                                                            mt: 0.15,
                                                            ...tableTimestampSx,
                                                        }}
                                                    >
                                                        {new Date(
                                                            pod.metadata
                                                                .creationTimestamp,
                                                        ).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default PodSelectionList;
