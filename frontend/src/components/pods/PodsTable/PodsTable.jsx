import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
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
                maxHeight: "calc(100vh - 200px)",
                overflow: "auto",
                border: "1px solid #dfe3e8",
                borderRadius: 1.5,
                boxShadow: "none",
                "&::-webkit-scrollbar": {
                    width: "10px",
                    height: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#d7dce1",
                    borderRadius: "5px",
                    "&:hover": {
                        backgroundColor: "#c2c8cf",
                    },
                },
                "&::-webkit-scrollbar-track": {
                    backgroundColor: "#f3f4f6",
                    borderRadius: "5px",
                },
            }}
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
