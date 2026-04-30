import React from "react";
import {
    TableRow,
    TableCell,
    Box,
    Chip,
    IconButton,
    Collapse,
    useTheme,
    alpha,
} from "@mui/material";
import { ChevronRight, ExpandMore, Delete } from "@mui/icons-material";
import SchedulingStatusChip from "../../scheduling/SchedulingStatusChip";
import {
    tableNameSx,
    tableNumericSx,
    tableTimestampSx,
} from "../../scheduling/tableDataStyles";

const QueueTreeNode = ({
    node,
    level = 0,
    allocatedFields,
    handleQueueClick,
    handleOpenDeleteDialog,
    expandedNodes,
    onToggleExpand,
}) => {
    const theme = useTheme();
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.metadata.name);

    // Calculate indentation (24px per level, max at level 5)
    const indentLevel = Math.min(level, 5);
    const indentation = indentLevel * 24;

    // Apply subtle background shading for depth
    const depthAlpha = Math.min(level * 0.02, 0.1);
    const depthBackground = alpha(theme.palette.primary.main, depthAlpha);

    return (
        <>
            <TableRow
                hover
                onClick={(e) => {
                    if (!(e.target as Element).closest("button")) {
                        handleQueueClick(node);
                    }
                }}
                sx={{
                    height: "60px",
                    bgcolor: depthBackground,
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
                        paddingLeft: `${24 + indentation}px`,
                        ...tableNameSx,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        {hasChildren ? (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleExpand(node.metadata.name);
                                }}
                                sx={{
                                    padding: "4px",
                                    transition: "transform 0.2s",
                                    transform: isExpanded
                                        ? "rotate(0deg)"
                                        : "rotate(0deg)",
                                }}
                            >
                                {isExpanded ? (
                                    <ExpandMore fontSize="small" />
                                ) : (
                                    <ChevronRight fontSize="small" />
                                )}
                            </IconButton>
                        ) : (
                            <Box sx={{ width: 28 }} />
                        )}
                        <span>{node.metadata.name}</span>
                        {level > 5 && (
                            <Chip
                                label={`L${level}`}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: "0.7rem",
                                    bgcolor: alpha(
                                        theme.palette.warning.main,
                                        0.2,
                                    ),
                                    color: theme.palette.warning.dark,
                                }}
                            />
                        )}
                    </Box>
                </TableCell>

                {allocatedFields.map((field) => (
                    <TableCell
                        key={field}
                        sx={{
                            padding: "16px 24px",
                            ...tableNumericSx,
                        }}
                    >
                        {node.status?.allocated?.[field] || "0"}
                    </TableCell>
                ))}

                <TableCell
                    sx={{
                        padding: "16px 24px",
                        color: alpha(theme.palette.text.primary, 0.85),
                        ...tableTimestampSx,
                    }}
                >
                    {new Date(node.metadata.creationTimestamp).toLocaleString()}
                </TableCell>

                <TableCell sx={{ padding: "16px 24px" }}>
                    <SchedulingStatusChip
                        minWidth={78}
                        size="medium"
                        status={node.status ? node.status.state : "Unknown"}
                    />
                </TableCell>

                <TableCell sx={{ padding: "16px 24px" }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(node.metadata.name);
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

            {/* Recursively render children with collapse animation */}
            {hasChildren && (
                <TableRow>
                    <TableCell
                        colSpan={allocatedFields.length + 4}
                        sx={{ padding: 0, border: 0 }}
                    >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box component="table" sx={{ width: "100%" }}>
                                <Box component="tbody">
                                    {node.children.map((child) => (
                                        <QueueTreeNode
                                            key={child.metadata.name}
                                            node={child}
                                            level={level + 1}
                                            allocatedFields={allocatedFields}
                                            handleQueueClick={handleQueueClick}
                                            handleOpenDeleteDialog={
                                                handleOpenDeleteDialog
                                            }
                                            expandedNodes={expandedNodes}
                                            onToggleExpand={onToggleExpand}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default QueueTreeNode;
