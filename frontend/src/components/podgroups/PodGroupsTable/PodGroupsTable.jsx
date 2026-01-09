import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
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
    const theme = useTheme();

    return (
        <React.Fragment>
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
                    "&::-webkit-scrollbar": {
                        width: "10px",
                        height: "10px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: "5px",
                        "&:hover": {
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.3,
                            ),
                        },
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05,
                        ),
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
