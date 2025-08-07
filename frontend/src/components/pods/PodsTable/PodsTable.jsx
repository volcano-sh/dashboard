import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
    alpha,
} from "@mui/material";
import TableHeader from "./TableHeader";
import PodRow from "./PodRow";

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
    const [anchorEl, setAnchorEl] = React.useState({
        status: null,
        namespace: null,
    });

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
                width: '100%',
                maxWidth: '100%',
                maxHeight: "calc(100vh - 200px)",
                overflow: "auto",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
            <Table
                stickyHeader
                sx={{
                    minWidth: 750,
                    tableLayout: 'auto',
                }}
            >
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
                            key={`${pod.metadata.namespace}-${pod.metadata.name}`}
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
