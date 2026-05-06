import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import SchedulingTableHeader from "../../scheduling/SchedulingTableHeader";
import SchedulingTableSurface from "../../scheduling/SchedulingTableSurface";
import PodRow from "./PodRow";

const PodsTable = ({
    pods,
    selectedPod,
    filters,
    uniqueStatuses,
    allNamespaces,
    allPodGroups,
    allQueues,
    anchorEl,
    onFilterOpen,
    onFilterSelect,
    sortDirection,
    onSortDirectionToggle,
    onPodClick,
}) => {
    const filterColumn = (key, options) => ({
        anchorEl: anchorEl[key],
        onOpen: (event) => onFilterOpen(key, event),
        onSelect: (value) => onFilterSelect(key, value),
        options,
        value: filters[key],
    });
    const sortedPods = React.useMemo(
        () =>
            [...pods].sort((a, b) => {
                const compareResult =
                    new Date(b.metadata.creationTimestamp).getTime() -
                    new Date(a.metadata.creationTimestamp).getTime();
                return sortDirection === "desc"
                    ? compareResult
                    : -compareResult;
            }),
        [pods, sortDirection],
    );

    return (
        <SchedulingTableSurface>
            <Table stickyHeader>
                <SchedulingTableHeader
                    columns={[
                        { key: "name", label: "Name", minWidth: 180 },
                        {
                            filter: filterColumn("namespace", allNamespaces),
                            key: "namespace",
                            label: "Namespace",
                            minWidth: 150,
                        },
                        {
                            filter: filterColumn("queue", allQueues),
                            key: "queue",
                            label: "Queue",
                            minWidth: 150,
                        },
                        {
                            filter: filterColumn("podGroup", allPodGroups),
                            key: "podGroup",
                            label: "PodGroup",
                            minWidth: 160,
                        },
                        {
                            key: "created",
                            label: "Creation Time",
                            minWidth: 180,
                            onSort: onSortDirectionToggle,
                            sortable: true,
                            sortDirection,
                        },
                        {
                            filter: filterColumn("status", uniqueStatuses),
                            key: "status",
                            label: "Status",
                            minWidth: 140,
                        },
                        { key: "age", label: "Age", minWidth: 120 },
                    ]}
                />
                <TableBody>
                    {sortedPods.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center">
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
        </SchedulingTableSurface>
    );
};

export default PodsTable;
