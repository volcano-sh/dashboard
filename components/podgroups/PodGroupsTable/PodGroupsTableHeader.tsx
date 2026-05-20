import React from "react";
import SchedulingTableHeader from "../../scheduling/SchedulingTableHeader";

const PodGroupsTableHeader = ({
    filters,
    uniqueStatuses,
    allNamespaces,
    allQueues,
    anchorEl,
    handleFilterClick,
    handleFilterClose,
    sortDirection,
    toggleSortDirection,
}) => {
    const filterColumn = (key, options) => ({
        anchorEl: anchorEl[key],
        onOpen: (event) => handleFilterClick(key, event),
        onSelect: (value) => handleFilterClose(key, value),
        options,
        value: filters[key],
    });

    return (
        <SchedulingTableHeader
            columns={[
                { key: "name", label: "Name", minWidth: 220 },
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
                { key: "minMember", label: "Min Member", minWidth: 120 },
                {
                    key: "created",
                    label: "Creation Time",
                    minWidth: 180,
                    onSort: toggleSortDirection,
                    sortable: true,
                    sortDirection,
                },
                {
                    filter: filterColumn("status", uniqueStatuses),
                    key: "status",
                    label: "Status",
                    minWidth: 150,
                },
            ]}
        />
    );
};

export default PodGroupsTableHeader;
