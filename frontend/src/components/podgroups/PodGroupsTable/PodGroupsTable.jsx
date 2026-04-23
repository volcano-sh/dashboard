import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
} from "@mui/material";
import PodGroupsTableHeader from "./PodGroupsTableHeader";
import PodGroupsTableRow from "./PodGroupsTableRow";

const PodGroupsTable = ({
    podGroups,
    handlePodGroupClick,
    filters,
    uniqueStatuses,
    allNamespaces,
    anchorEl,
    handleFilterClick,
    handleFilterClose,
    sortDirection,
    toggleSortDirection,
}) => {
    return (
        <React.Fragment>
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
                    <PodGroupsTableHeader
                        filters={filters}
                        uniqueStatuses={uniqueStatuses}
                        allNamespaces={allNamespaces}
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
            </TableContainer>
        </React.Fragment>
    );
};

export default PodGroupsTable;
