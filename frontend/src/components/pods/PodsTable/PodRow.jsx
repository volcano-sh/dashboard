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
    Checkbox,
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
    isSelected,
    onSelect,
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

    const handleSelect = (event) => {
        event.stopPropagation();
        onSelect(pod, event.target.checked);
    };

    const handleRowClick = (event) => {
        // Don't trigger row click if clicking on checkbox or action buttons
        if (
            event.target.closest(".MuiCheckbox-root") ||
            event.target.closest(".MuiIconButton-root")
        ) {
            return;
        }
        onPodClick(pod);
    };

    const getAge = (creationTimestamp) => {
        const now = new Date();
        const created = new Date(creationTimestamp);
        const diffInSeconds = Math.floor((now - created) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds}s`;
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours}h`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) {
            return `${diffInDays}d`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths}mo`;
        }

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears}y`;
    };

    const renderCell = (columnKey) => {
        if (!visibleColumns[columnKey]) return null;

        const commonCellProps = {
            sx: {
                padding: "16px 24px",
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
        };

        if (columnKey === "select") {
            return (
                <TableCell
                    padding="checkbox"
                    sx={{
                        ...commonCellProps.sx,
                        minWidth: 50,
                        width: 50,
                    }}
                >
                    <Checkbox
                        checked={isSelected}
                        onChange={handleSelect}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                            color: theme.palette.primary.main,
                            "&.Mui-checked": {
                                color: theme.palette.primary.main,
                            },
                        }}
                    />
                </TableCell>
            );
        }

        switch (columnKey) {
            case "name":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                            }}
                        >
                            {pod.metadata.name}
                        </Typography>
                    </TableCell>
                );
            case "namespace":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.secondary,
                            }}
                        >
                            {pod.metadata.namespace}
                        </Typography>
                    </TableCell>
                );
            case "queue":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.secondary,
                            }}
                        >
                            {pod.spec?.queue || "-"}
                        </Typography>
                    </TableCell>
                );
            case "creationTime":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                            }}
                        >
                            {new Date(
                                pod.metadata.creationTimestamp,
                            ).toLocaleString()}
                        </Typography>
                    </TableCell>
                );
            case "age":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.secondary,
                            }}
                        >
                            {getAge(pod.metadata.creationTimestamp)}
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
                                px: 1.5,
                                py: 0.75,
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
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
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
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.secondary,
                            }}
                        >
                            {pod.status?.phase || "-"}
                        </Typography>
                    </TableCell>
                );
            case "resources":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ width: "100%", mb: 1 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                CPU:{" "}
                                {Math.round(
                                    (pod.status?.resourceUsage?.cpu || 0) * 100,
                                )}
                                %
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                    (pod.status?.resourceUsage?.cpu || 0) * 100,
                                    100,
                                )}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        </Box>
                        <Box sx={{ width: "100%" }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                Memory:{" "}
                                {Math.round(
                                    (pod.status?.resourceUsage?.memory || 0) *
                                        100,
                                )}
                                %
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                    (pod.status?.resourceUsage?.memory || 0) *
                                        100,
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
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.secondary,
                            }}
                        >
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
            onClick={handleRowClick}
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
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
};

export default PodRow;
