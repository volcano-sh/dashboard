import React, { useState } from "react";
import PropTypes from "prop-types";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
    alpha,
    IconButton,
    Popover,
} from "@mui/material";
import { ViewColumn } from "@mui/icons-material";
import JobTableHeader from "./JobTableHeader";
import JobTableRow from "./JobTableRow";
import ColumnVisibilityFilter from "../../filters/ColumnVisibilityFilter";

const COLUMNS = [
    { key: "name", label: "Name" },
    { key: "namespace", label: "Namespace" },
    { key: "queue", label: "Queue" },
    { key: "creationTime", label: "Creation Time" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
];

const JobTable = ({
    jobs,
    handleJobClick,
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
    const theme = useTheme();
    const [columnFilterAnchor, setColumnFilterAnchor] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState(() =>
        COLUMNS.reduce(
            (acc, col) => ({
                ...acc,
                [col.key]: true,
            }),
            {},
        ),
    );

    const handleColumnToggle = (columnKey, isVisible) => {
        setVisibleColumns((prev) => ({
            ...prev,
            [columnKey]: isVisible,
        }));
    };

    return (
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
                position: "relative",
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
            <IconButton
                onClick={(e) => setColumnFilterAnchor(e.currentTarget)}
                sx={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    zIndex: 1000,
                }}
            >
                <ViewColumn />
            </IconButton>

            <Popover
                open={Boolean(columnFilterAnchor)}
                anchorEl={columnFilterAnchor}
                onClose={() => setColumnFilterAnchor(null)}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <ColumnVisibilityFilter
                    columns={COLUMNS}
                    visibleColumns={visibleColumns}
                    onColumnToggle={handleColumnToggle}
                />
            </Popover>

            <Table stickyHeader>
                <JobTableHeader
                    filters={filters}
                    uniqueStatuses={uniqueStatuses}
                    allNamespaces={allNamespaces}
                    allQueues={allQueues}
                    anchorEl={anchorEl}
                    handleFilterClick={handleFilterClick}
                    handleFilterClose={handleFilterClose}
                    sortDirection={sortDirection}
                    toggleSortDirection={toggleSortDirection}
                    visibleColumns={visibleColumns}
                />
                <TableBody>
                    {jobs.map((job) => (
                        <JobTableRow
                            key={`${job.metadata.namespace}-${job.metadata.name}`}
                            job={job}
                            handleJobClick={handleJobClick}
                            visibleColumns={visibleColumns}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

JobTable.propTypes = {
    jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
    handleJobClick: PropTypes.func.isRequired,
    filters: PropTypes.object.isRequired,
    uniqueStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    allQueues: PropTypes.arrayOf(PropTypes.string).isRequired,
    anchorEl: PropTypes.object.isRequired,
    handleFilterClick: PropTypes.func.isRequired,
    handleFilterClose: PropTypes.func.isRequired,
    sortDirection: PropTypes.string.isRequired,
    toggleSortDirection: PropTypes.func.isRequired,
};

export default JobTable;

