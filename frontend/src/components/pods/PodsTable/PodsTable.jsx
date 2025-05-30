import React, { useState } from "react";
import PropTypes from "prop-types";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
    alpha,
    IconButton,
    Popover,
} from "@mui/material";
import TableHeader from "./TableHeader";
import PodRow from "./PodRow";
import { ViewColumn } from "@mui/icons-material";
import ColumnVisibilityFilter from "../../filters/ColumnVisibilityFilter";

const COLUMNS = [
    { key: "name", label: "Name" },
    { key: "namespace", label: "Namespace" },
    { key: "creationTime", label: "Creation Time" },
    { key: "status", label: "Status" },
    { key: "age", label: "Age" },
];

const PodsTable = ({
    pods,
    filters,
    allNamespaces,
    sortDirection,
    onSortDirectionToggle,
    onFilterChange,
    onPodClick,
}) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
        columnFilter: null,
    });

    const [visibleColumns, setVisibleColumns] = useState(() =>
        COLUMNS.reduce(
            (acc, col) => ({
                ...acc,
                [col.key]: true,
            }),
            {},
        ),
    );

    const handleColumnToggle = (columnKey, isVisible) => {
        setVisibleColumns((prev) => ({
            ...prev,
            [columnKey]: isVisible,
        }));
    };

    const handleFilterClick = React.useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = React.useCallback(
        (filterType, value) => {
            onFilterChange(filterType, value);
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        },
        [onFilterChange],
    );

    const filteredPods = React.useMemo(
        () =>
            pods.filter(
                (pod) =>
                    (filters.status === "All" ||
                        (pod.status && pod.status.phase === filters.status)) &&
                    (!filters.queue ||
                        filters.queue === "All" ||
                        pod.spec.queue === filters.queue),
            ),
        [pods, filters],
    );

    const sortedPods = React.useMemo(
        () =>
            [...filteredPods].sort((a, b) => {
                const compareResult =
                    new Date(b.metadata.creationTimestamp) -
                    new Date(a.metadata.creationTimestamp);
                return sortDirection === "desc"
                    ? compareResult
                    : -compareResult;
            }),
        [filteredPods, sortDirection],
    );

    const getStatusColor = React.useCallback(
        (status) => {
            switch (status) {
                case "Failed":
                    return theme.palette.error.main;
                case "Pending":
                    return theme.palette.warning.main;
                case "Running":
                    return theme.palette.success.main;
                case "Succeeded":
                    return theme.palette.info.main;
                default:
                    return theme.palette.grey[500];
            }
        },
        [theme],
    );

    return (
        <TableContainer
            component={Paper}
            sx={{
                maxHeight: "calc(100vh - 200px)",
                overflow: "auto",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                position: "relative",
                "&::-webkit-scrollbar": {
                    width: "10px",
                    height: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "5px",
                    "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    },
                },
                "&::-webkit-scrollbar-track": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: "5px",
                },
            }}
        >
            <IconButton
                onClick={(e) => handleFilterClick("columnFilter", e)}
                sx={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    zIndex: 1000,
                }}
            >
                <ViewColumn />
            </IconButton>

            <Popover
                open={Boolean(anchorEl.columnFilter)}
                anchorEl={anchorEl.columnFilter}
                onClose={() =>
                    setAnchorEl((prev) => ({ ...prev, columnFilter: null }))
                }
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <ColumnVisibilityFilter
                    columns={COLUMNS}
                    visibleColumns={visibleColumns}
                    onColumnToggle={handleColumnToggle}
                />
            </Popover>

            <Table stickyHeader>
                <TableHeader
                    filters={filters}
                    anchorEl={anchorEl}
                    handleFilterClick={handleFilterClick}
                    handleFilterClose={handleFilterClose}
                    allNamespaces={allNamespaces}
                    onSortDirectionToggle={onSortDirectionToggle}
                    sortDirection={sortDirection}
                    visibleColumns={visibleColumns}
                />
                <TableBody>
                    {sortedPods.map((pod) => (
                        <PodRow
                            key={`${pod.metadata.namespace}-${pod.metadata.name}`}
                            pod={pod}
                            visibleColumns={visibleColumns}
                            getStatusColor={getStatusColor}
                            onPodClick={onPodClick}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

PodsTable.propTypes = {
    pods: PropTypes.arrayOf(
        PropTypes.shape({
            metadata: PropTypes.shape({
                name: PropTypes.string.isRequired,
                namespace: PropTypes.string.isRequired,
                creationTimestamp: PropTypes.string.isRequired,
            }).isRequired,
            status: PropTypes.shape({
                phase: PropTypes.string,
            }),
            spec: PropTypes.shape({
                queue: PropTypes.string,
            }),
        }),
    ).isRequired,
    filters: PropTypes.shape({
        status: PropTypes.string.isRequired,
        queue: PropTypes.string,
    }).isRequired,
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    sortDirection: PropTypes.oneOf(["asc", "desc"]).isRequired,
    onSortDirectionToggle: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    onPodClick: PropTypes.func.isRequired,
};

export default PodsTable;

