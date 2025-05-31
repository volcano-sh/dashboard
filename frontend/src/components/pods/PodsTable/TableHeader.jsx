import React from "react";
import PropTypes from "prop-types";
import {
    TableHead,
    TableRow,
    TableCell,
    Typography,
    Button,
    Box,
    useTheme,
    alpha,
    Menu,
    MenuItem,
    Checkbox,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    UnfoldMore,
    FilterAlt,
} from "@mui/icons-material";

const TableHeader = ({
    filters,
    filterMenuAnchor,
    handleFilterButtonClick,
    handleFilterSelect,
    handleFilterMenuClose,
    getFilterOptions,
    sortDirection,
    onSortDirectionToggle,
    visibleColumns,
    columns,
    selectedPods,
    onSelectAll,
    totalPods,
}) => {
    const theme = useTheme();

    const renderFilterButton = (filterType) => (
        <Button
            size="small"
            onClick={(e) => handleFilterButtonClick(e, filterType)}
            startIcon={<FilterAlt />}
            sx={{
                textTransform: "none",
                padding: "4px 12px",
                minWidth: "auto",
                borderRadius: "20px",
                marginLeft: "8px",
                fontSize: "0.8rem",
                fontWeight: 500,
                letterSpacing: "0.02em",
                backgroundColor:
                    filters[filterType] !== "All"
                        ? alpha(theme.palette.primary.main, 0.1)
                        : "transparent",
                color: theme.palette.primary.main,
                "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
            }}
        >
            {filters[filterType]}
        </Button>
    );

    const renderColumnHeader = (columnKey) => {
        if (!visibleColumns[columnKey]) return null;

        const commonCellProps = {
            sx: {
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: "blur(8px)",
                padding: "16px 24px",
                minWidth: 140,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
                        indeterminate={
                            selectedPods.length > 0 &&
                            selectedPods.length < totalPods
                        }
                        checked={
                            selectedPods.length > 0 &&
                            selectedPods.length === totalPods
                        }
                        onChange={onSelectAll}
                        sx={{
                            color: theme.palette.primary.main,
                            "&.Mui-checked": {
                                color: theme.palette.primary.main,
                            },
                            "&.MuiCheckbox-indeterminate": {
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
                            variant="subtitle1"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                                textTransform: "uppercase",
                            }}
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            case "namespace":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.02em",
                                    color: theme.palette.text.primary,
                                    textTransform: "uppercase",
                                }}
                            >
                                {columns[columnKey].label}
                            </Typography>
                            {renderFilterButton("namespace")}
                            <Menu
                                anchorEl={filterMenuAnchor.namespace}
                                open={Boolean(filterMenuAnchor.namespace)}
                                onClose={() =>
                                    handleFilterMenuClose("namespace")
                                }
                            >
                                {getFilterOptions("namespace").map((option) => (
                                    <MenuItem
                                        key={option}
                                        onClick={() =>
                                            handleFilterSelect(
                                                "namespace",
                                                option,
                                            )
                                        }
                                        selected={filters.namespace === option}
                                        sx={{
                                            fontSize: "0.875rem",
                                            minHeight: "40px",
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                backgroundColor: alpha(
                                                    theme.palette.primary.main,
                                                    0.08,
                                                ),
                                                paddingLeft: "24px",
                                            },
                                            ...(filters.namespace ===
                                                option && {
                                                backgroundColor: alpha(
                                                    theme.palette.primary.main,
                                                    0.12,
                                                ),
                                                fontWeight: 600,
                                                "&::before": {
                                                    content: '""',
                                                    position: "absolute",
                                                    left: "0",
                                                    top: "0",
                                                    bottom: "0",
                                                    width: "3px",
                                                    backgroundColor:
                                                        theme.palette.primary
                                                            .main,
                                                },
                                            }),
                                        }}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </TableCell>
                );
            case "queue":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                                textTransform: "uppercase",
                            }}
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            case "creationTime":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.02em",
                                    color: theme.palette.text.primary,
                                    textTransform: "uppercase",
                                }}
                            >
                                {columns[columnKey].label}
                            </Typography>
                        </Box>
                    </TableCell>
                );
            case "age":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                                textTransform: "uppercase",
                            }}
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            case "node":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                                textTransform: "uppercase",
                            }}
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            case "status":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.02em",
                                    color: theme.palette.text.primary,
                                    textTransform: "uppercase",
                                }}
                            >
                                {columns[columnKey].label}
                            </Typography>
                            {renderFilterButton("status")}
                            <Menu
                                anchorEl={filterMenuAnchor.status}
                                open={Boolean(filterMenuAnchor.status)}
                                onClose={() => handleFilterMenuClose("status")}
                            >
                                {getFilterOptions("status").map((option) => (
                                    <MenuItem
                                        key={option}
                                        onClick={() =>
                                            handleFilterSelect("status", option)
                                        }
                                        selected={filters.status === option}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </TableCell>
                );
            case "phase":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontFamily: "'Roboto', sans-serif",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.02em",
                                    color: theme.palette.text.primary,
                                    textTransform: "uppercase",
                                }}
                            >
                                {columns[columnKey].label}
                            </Typography>
                            {renderFilterButton("phase")}
                            <Menu
                                anchorEl={filterMenuAnchor.phase}
                                open={Boolean(filterMenuAnchor.phase)}
                                onClose={() => handleFilterMenuClose("phase")}
                            >
                                {getFilterOptions("phase").map((option) => (
                                    <MenuItem
                                        key={option}
                                        onClick={() =>
                                            handleFilterSelect("phase", option)
                                        }
                                        selected={filters.phase === option}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </TableCell>
                );
            case "resources":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                                textTransform: "uppercase",
                            }}
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            case "actions":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontFamily: "'Roboto', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                color: theme.palette.text.primary,
                                textTransform: "uppercase",
                            }}
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            default:
                return null;
        }
    };

    return (
        <React.Fragment>
            <TableHead>
                <TableRow>
                    {Object.keys(columns).map((columnKey) =>
                        renderColumnHeader(columnKey),
                    )}
                </TableRow>
            </TableHead>
        </React.Fragment>
    );
};

TableHeader.propTypes = {
    filters: PropTypes.shape({
        status: PropTypes.string,
        namespace: PropTypes.string,
        queue: PropTypes.string,
        phase: PropTypes.string,
        node: PropTypes.string,
    }).isRequired,
    filterMenuAnchor: PropTypes.object.isRequired,
    handleFilterButtonClick: PropTypes.func.isRequired,
    handleFilterSelect: PropTypes.func.isRequired,
    handleFilterMenuClose: PropTypes.func.isRequired,
    getFilterOptions: PropTypes.func.isRequired,
    sortDirection: PropTypes.string.isRequired,
    onSortDirectionToggle: PropTypes.func.isRequired,
    visibleColumns: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
    selectedPods: PropTypes.array.isRequired,
    onSelectAll: PropTypes.func.isRequired,
    totalPods: PropTypes.number.isRequired,
};

export default TableHeader;
