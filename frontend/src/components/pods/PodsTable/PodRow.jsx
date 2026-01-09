import React from "react";
import PropTypes from "prop-types";
import {
    TableRow,
    TableCell,
    IconButton,
    Tooltip,
    Box,
    Typography,
    useTheme,
    alpha,
    LinearProgress,
} from "@mui/material";
import { Delete, Edit, Refresh } from "@mui/icons-material";

const PodRow = ({
    pod,
    getStatusColor,
    onPodClick,
    visibleColumns,
    columns,
    onDelete,
    onRefresh,
    onEdit,
}) => {
    const theme = useTheme();

    const handleAction = (e, action) => {
        e.stopPropagation();
        switch (action) {
            case "edit":
                onEdit?.(pod);
                break;
            case "delete":
                onDelete?.(pod);
                break;
            case "refresh":
                onRefresh?.(pod);
                break;
            default:
                break;
        }
    };

    const renderCell = (columnKey) => {
        if (!visibleColumns[columnKey]) return null;

        const commonCellProps = {
            sx: {
                padding: "12px 24px",
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
        };

        switch (columnKey) {
            case "name":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography variant="body2" color="text.primary">
                            {pod.metadata.name}
                        </Typography>
                    </TableCell>
                );
            case "namespace":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography variant="body2" color="text.secondary">
                            {pod.metadata.namespace}
                        </Typography>
                    </TableCell>
                );
            case "queue":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography variant="body2" color="text.secondary">
                            {pod.spec?.queue || "-"}
                        </Typography>
                    </TableCell>
                );
            case "creationTime":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography variant="body2" color="text.secondary">
                            {new Date(
                                pod.metadata.creationTimestamp,
                            ).toLocaleString()}
                        </Typography>
                    </TableCell>
                );
            case "status":
                return (
                    <TableCell {...commonCellProps}>
                        <Box
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: 1,
                                py: 0.5,
                                borderRadius: "12px",
                                backgroundColor: alpha(
                                    getStatusColor(pod.status?.phase),
                                    0.1,
                                ),
                            }}
                        >
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor: getStatusColor(
                                        pod.status?.phase,
                                    ),
                                    mr: 1,
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: getStatusColor(pod.status?.phase),
                                }}
                            >
                                {pod.status?.phase || "Unknown"}
                            </Typography>
                        </Box>
                    </TableCell>
                );
            case "phase":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography variant="body2" color="text.secondary">
                            {pod.status?.phase || "-"}
                        </Typography>
                    </TableCell>
                );
            case "resources":
                const cpuUsage = pod.status?.resourceUsage?.cpu || 0;
                const memoryUsage = pod.status?.resourceUsage?.memory || 0;
                const cpuLimit =
                    pod.spec?.containers?.[0]?.resources?.limits?.cpu || 1;
                const memoryLimit =
                    pod.spec?.containers?.[0]?.resources?.limits?.memory ||
                    1024;

                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ width: "100%", mb: 1 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                CPU: {Math.round((cpuUsage * 100) / cpuLimit)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                    (cpuUsage * 100) / cpuLimit,
                                    100,
                                )}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        </Box>
                        <Box sx={{ width: "100%" }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Memory:{" "}
                                {Math.round((memoryUsage * 100) / memoryLimit)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                    (memoryUsage * 100) / memoryLimit,
                                    100,
                                )}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        </Box>
                    </TableCell>
                );
            case "node":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography variant="body2" color="text.secondary">
                            {pod.spec?.nodeName || "-"}
                        </Typography>
                    </TableCell>
                );
            case "actions":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit">
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleAction(e, "edit")}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleAction(e, "delete")}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Refresh">
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleAction(e, "refresh")}
                                >
                                    <Refresh fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </TableCell>
                );
            default:
                return null;
        }
    };

    return (
        <TableRow
            hover
            onClick={() => onPodClick(pod)}
            sx={{
                cursor: "pointer",
                "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
            }}
        >
            {Object.keys(columns).map((columnKey) => renderCell(columnKey))}
        </TableRow>
    );
};

PodRow.propTypes = {
    pod: PropTypes.shape({
        metadata: PropTypes.shape({
            name: PropTypes.string.isRequired,
            namespace: PropTypes.string.isRequired,
            creationTimestamp: PropTypes.string.isRequired,
        }).isRequired,
        status: PropTypes.shape({
            phase: PropTypes.string,
            resourceUsage: PropTypes.shape({
                cpu: PropTypes.number,
                memory: PropTypes.number,
            }),
        }),
        spec: PropTypes.shape({
            queue: PropTypes.string,
            nodeName: PropTypes.string,
            containers: PropTypes.arrayOf(
                PropTypes.shape({
                    resources: PropTypes.shape({
                        limits: PropTypes.shape({
                            cpu: PropTypes.number,
                            memory: PropTypes.number,
                        }),
                    }),
                }),
            ),
        }),
    }).isRequired,
    getStatusColor: PropTypes.func.isRequired,
    onPodClick: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    onRefresh: PropTypes.func,
    onEdit: PropTypes.func,
    visibleColumns: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
};

export default PodRow;
