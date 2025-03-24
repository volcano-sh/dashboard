import React, { useMemo, useState, useCallback } from "react";
import {
    Box,
    Button,
    Chip,
    Menu,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    FilterList,
    UnfoldMore,
} from "@mui/icons-material";
import { calculateAge } from "../utils";

const FilterMenu = ({ anchorEl, handleClose, items, filterType }) => (
    <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(filterType, null)}
    >
        {items.map((item) => (
            <MenuItem key={item} onClick={() => handleClose(filterType, item)}>
                {item}
            </MenuItem>
        ))}
    </Menu>
);

const TableHeader = ({
    filters,
    anchorEl,
    handleFilterClick,
    handleFilterClose,
    allNamespaces,
    onSortDirectionToggle,
    sortDirection,
}) => (
    <TableHead>
        <TableRow>
            {["Name", "Namespace", "Creation Time", "Status", "Age"].map(
                (header) => (
                    <TableCell
                        key={header}
                        sx={{
                            backgroundColor: "background.paper",
                            padding: "8px 16px",
                            minWidth: 120,
                        }}
                    >
                        <Typography variant="h6">{header}</Typography>
                        {(header === "Namespace" || header === "Status") && (
                            <Button
                                size="small"
                                startIcon={<FilterList />}
                                onClick={(e) =>
                                    handleFilterClick(header.toLowerCase(), e)
                                }
                                sx={{
                                    textTransform: "none",
                                    padding: 0,
                                    minWidth: "auto",
                                }}
                            >
                                Filter: {filters[header.toLowerCase()]}
                            </Button>
                        )}
                        {header === "Creation Time" && (
                            <Button
                                size="small"
                                onClick={onSortDirectionToggle}
                                startIcon={
                                    sortDirection === "desc" ? (
                                        <ArrowDownward />
                                    ) : sortDirection === "asc" ? (
                                        <ArrowUpward />
                                    ) : (
                                        <UnfoldMore />
                                    )
                                }
                                sx={{
                                    textTransform: "none",
                                    padding: 0,
                                    minWidth: "auto",
                                }}
                            >
                                Sort
                            </Button>
                        )}
                    </TableCell>
                ),
            )}
        </TableRow>
        <FilterMenu
            anchorEl={anchorEl.namespace}
            handleClose={handleFilterClose}
            items={allNamespaces}
            filterType="namespace"
        />
        <FilterMenu
            anchorEl={anchorEl.status}
            handleClose={handleFilterClose}
            items={["All", "Running", "Pending", "Succeeded", "Failed"]}
            filterType="status"
        />
    </TableHead>
);

const PodRow = ({ pod, getStatusColor, onPodClick }) => (
    <TableRow
        key={`${pod.metadata.namespace}-${pod.metadata.name}`}
        sx={{
            "&:nth-of-type(odd)": { bgcolor: "action.hover" },
            "&:hover": {
                bgcolor: "action.hover",
                color: "primary.main",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            },
            cursor: "pointer",
        }}
        onClick={() => onPodClick(pod)}
    >
        <TableCell>{pod.metadata.name}</TableCell>
        <TableCell>{pod.metadata.namespace}</TableCell>
        <TableCell>
            {new Date(pod.metadata.creationTimestamp).toLocaleString()}
        </TableCell>
        <TableCell>
            <Chip
                label={pod.status ? pod.status.phase : "Unknown"}
                sx={{
                    bgcolor: getStatusColor(
                        pod.status ? pod.status.phase : "Unknown",
                    ),
                    color: "common.white",
                }}
            />
        </TableCell>
        <TableCell>{calculateAge(pod.metadata.creationTimestamp)}</TableCell>
    </TableRow>
);

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
    const [anchorEl, setAnchorEl] = useState({ status: null, namespace: null });

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback(
        (filterType, value) => {
            onFilterChange(filterType, value);
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        },
        [onFilterChange],
    );

    const filteredPods = useMemo(
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

    const sortedPods = useMemo(
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

    const getStatusColor = useCallback(
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
            sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
        >
            <Table stickyHeader>
                <TableHeader
                    filters={filters}
                    anchorEl={anchorEl}
                    handleFilterClick={handleFilterClick}
                    handleFilterClose={handleFilterClose}
                    allNamespaces={allNamespaces}
                    onSortDirectionToggle={onSortDirectionToggle}
                    sortDirection={sortDirection}
                />
                <TableBody>
                    {sortedPods.map((pod) => (
                        <PodRow
                            key={pod.metadata.name}
                            pod={pod}
                            getStatusColor={getStatusColor}
                            onPodClick={onPodClick}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PodsTable;
