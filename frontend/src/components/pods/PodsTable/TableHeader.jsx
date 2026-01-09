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
    allNamespaces,
    allQueues,
    sortDirection,
    onSortDirectionToggle,
    visibleColumns,
    columns,
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

        switch (columnKey) {
            case "name":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            fontWeight="700"
                            color="text.primary"
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
                                fontWeight="700"
                                color="text.primary"
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
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color="text.primary"
                            >
                                {columns[columnKey].label}
                            </Typography>
                            {renderFilterButton("queue")}
                            <Menu
                                anchorEl={filterMenuAnchor.queue}
                                open={Boolean(filterMenuAnchor.queue)}
                                onClose={() => handleFilterMenuClose("queue")}
                            >
                                {getFilterOptions("queue").map((option) => (
                                    <MenuItem
                                        key={option}
                                        onClick={() =>
                                            handleFilterSelect("queue", option)
                                        }
                                        selected={filters.queue === option}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </TableCell>
                );
            case "creationTime":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color="text.primary"
                            >
                                {columns[columnKey].label}
                            </Typography>
                            <Button
                                size="small"
                                onClick={onSortDirectionToggle}
                                startIcon={
                                    sortDirection === "desc" ? (
                                        <ArrowDownward fontSize="small" />
                                    ) : sortDirection === "asc" ? (
                                        <ArrowUpward fontSize="small" />
                                    ) : (
                                        <UnfoldMore fontSize="small" />
                                    )
                                }
                                sx={{
                                    textTransform: "none",
                                    padding: "4px 12px",
                                    minWidth: "auto",
                                    borderRadius: "20px",
                                    marginTop: "8px",
                                    fontSize: "0.8rem",
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
                                    backgroundColor: alpha(
                                        theme.palette.primary.main,
                                        0.1,
                                    ),
                                    color: theme.palette.primary.main,
                                    "&:hover": {
                                        backgroundColor: alpha(
                                            theme.palette.primary.main,
                                            0.15,
                                        ),
                                        transform: "translateY(-2px)",
                                    },
                                }}
                            >
                                Sort
                            </Button>
                        </Box>
                    </TableCell>
                );
            case "status":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color="text.primary"
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
                                fontWeight="700"
                                color="text.primary"
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
                            fontWeight="700"
                            color="text.primary"
                        >
                            {columns[columnKey].label}
                        </Typography>
                    </TableCell>
                );
            case "node":
                return (
                    <TableCell {...commonCellProps}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color="text.primary"
                            >
                                {columns[columnKey].label}
                            </Typography>
                            {renderFilterButton("node")}
                            <Menu
                                anchorEl={filterMenuAnchor.node}
                                open={Boolean(filterMenuAnchor.node)}
                                onClose={() => handleFilterMenuClose("node")}
                            >
                                {getFilterOptions("node").map((option) => (
                                    <MenuItem
                                        key={option}
                                        onClick={() =>
                                            handleFilterSelect("node", option)
                                        }
                                        selected={filters.node === option}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </TableCell>
                );
            case "actions":
                return (
                    <TableCell {...commonCellProps}>
                        <Typography
                            variant="subtitle1"
                            fontWeight="700"
                            color="text.primary"
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
        <TableHead>
            <TableRow>
                {Object.keys(columns).map((columnKey) =>
                    renderColumnHeader(columnKey),
                )}
            </TableRow>
        </TableHead>
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
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    allQueues: PropTypes.arrayOf(PropTypes.string).isRequired,
    sortDirection: PropTypes.string.isRequired,
    onSortDirectionToggle: PropTypes.func.isRequired,
    visibleColumns: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
};

export default TableHeader;
