import React from "react";
import { Table, TableBody, TableRow, TableCell } from "@mui/material";
import SchedulingTableSurface from "../../scheduling/SchedulingTableSurface";
import PodGroupsTableHeader from "./PodGroupsTableHeader";
import PodGroupsTableRow from "./PodGroupsTableRow";

const PodGroupsTable = ({
    podGroups,
    handlePodGroupClick,
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
    return (
        <React.Fragment>
            <SchedulingTableSurface>
                <Table stickyHeader>
                    <PodGroupsTableHeader
                        filters={filters}
                        uniqueStatuses={uniqueStatuses}
                        allNamespaces={allNamespaces}
                        allQueues={allQueues}
                        anchorEl={anchorEl}
                        handleFilterClick={handleFilterClick}
                        handleFilterClose={handleFilterClose}
                        sortDirection={sortDirection}
                        toggleSortDirection={toggleSortDirection}
                    />
                    <TableBody>
                        {podGroups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No podgroups found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            podGroups.map((pg) => (
                                <PodGroupsTableRow
                                    key={`${pg.metadata.namespace}-${pg.metadata.name}`}
                                    podGroup={pg}
                                    handlePodGroupClick={handlePodGroupClick}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </SchedulingTableSurface>
        </React.Fragment>
    );
};

export default PodGroupsTable;
