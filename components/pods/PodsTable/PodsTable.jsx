import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableCell,
    TableRow,
    useTheme,
} from "@mui/material";
import TableHeader from "./TableHeader";
import PodRow from "./PodRow";

const PodsTable = ({
    pods,
    filters,
    sortDirection,
    onSortDirectionToggle,
    onPodClick,
}) => {
    const theme = useTheme();
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
                    onSortDirectionToggle={onSortDirectionToggle}
                    sortDirection={sortDirection}
                />
                <TableBody>
                    {sortedPods.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                No pods found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedPods.map((pod) => (
                            <PodRow
                                key={`${pod.metadata.namespace}-${pod.metadata.name}`}
                                pod={pod}
                                getStatusColor={getStatusColor}
                                onPodClick={onPodClick}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PodsTable;
