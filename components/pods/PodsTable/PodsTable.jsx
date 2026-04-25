import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableCell,
    TableRow,
} from "@mui/material";
import TableHeader from "./TableHeader";
import PodRow from "./PodRow";

const PodsTable = ({
    pods,
    selectedPod,
    sortDirection,
    onSortDirectionToggle,
    onPodClick,
}) => {
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
                                isSelected={
                                    selectedPod?.metadata?.namespace ===
                                        pod.metadata.namespace &&
                                    selectedPod?.metadata?.name ===
                                        pod.metadata.name
                                }
                                pod={pod}
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
