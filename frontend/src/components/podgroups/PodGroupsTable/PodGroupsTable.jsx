import React, { useMemo } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
    TableHead,
    Typography,
    Box,
    IconButton,
} from "@mui/material";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getSortedRowModel,
    getFilteredRowModel,
} from "@tanstack/react-table";
import { ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";
import TableFilterMenu from "../../TableFilterMenu";
import JobStatusChip from "../../jobs/JobStatusChip";

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

    const columns = useMemo(
        () => [
            {
                header: "Name",
                accessorKey: "metadata.name",
                cell: ({ row }) => (
                    <Typography fontWeight={600} color="text.primary" letterSpacing="0.01em">
                        {row.original.metadata.name}
                    </Typography>
                ),
            },
            {
                header: "Namespace",
                accessorKey: "metadata.namespace",
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500}>
                        {row.original.metadata.namespace}
                    </Typography>
                ),
            },
            {
                header: "Queue",
                accessorKey: "spec.queue",
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500}>
                        {row.original.spec.queue || "N/A"}
                    </Typography>
                ),
            },
            {
                header: "Min Member",
                accessorKey: "spec.minMember",
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500}>
                        {row.original.spec.minMember || "N/A"}
                    </Typography>
                ),
            },
            {
                header: "Creation Time",
                accessorKey: "metadata.creationTimestamp",
                cell: ({ row }) => (
                    <Typography variant="body2" color={alpha(theme.palette.text.primary, 0.85)}>
                        {new Date(row.original.metadata.creationTimestamp).toLocaleString()}
                    </Typography>
                ),
            },
            {
                header: "Status",
                accessorKey: "status.phase",
                cell: ({ row }) => (
                    <Box
                        sx={{
                            display: "inline-block",
                            transition: "all 0.3s ease",
                            "&:hover": { transform: "translateY(-2px)", filter: "brightness(1.05)" },
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                            borderRadius: "15px",
                        }}
                    >
                        <JobStatusChip
                            status={row.original.status ? row.original.status.phase : "Unknown"}
                            sx={{
                                height: "30px",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                padding: "0 12px",
                                color: "common.white",
                                borderRadius: "15px",
                            }}
                        />
                    </Box>
                ),
            },
        ],
        [theme],
    );

    const table = useReactTable({
        data: podGroups,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

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
                "&::-webkit-scrollbar": { width: "10px", height: "10px" },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: "5px",
                },
            }}
        >
            <Table stickyHeader>
                <TableHead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const headerText = header.column.columnDef.header;
                                const isFilterable = ["Namespace", "Status"].includes(headerText);
                                const isSortable = headerText === "Creation Time";

                                return (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                            backdropFilter: "blur(8px)",
                                            padding: "16px 24px",
                                            borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                        }}
                                    >
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                                                    {flexRender(headerText, header.getContext())}
                                                </Typography>
                                                {isFilterable && (
                                                    <TableFilterMenu
                                                        filterType={headerText.toLowerCase()}
                                                        currentValue={filters[headerText.toLowerCase()]}
                                                        options={headerText === "Namespace" ? allNamespaces : uniqueStatuses}
                                                        handleFilterClick={handleFilterClick}
                                                        handleFilterClose={handleFilterClose}
                                                        anchorEl={anchorEl[headerText.toLowerCase()]}
                                                    />
                                                )}
                                            </Box>
                                            {isSortable && (
                                                <IconButton
                                                    size="small"
                                                    onClick={toggleSortDirection}
                                                    sx={{
                                                        alignSelf: "flex-start",
                                                        borderRadius: "20px",
                                                        padding: "4px 12px",
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
                                                    }}
                                                >
                                                    {sortDirection === "desc" ? (
                                                        <ArrowDownward fontSize="small" />
                                                    ) : sortDirection === "asc" ? (
                                                        <ArrowUpward fontSize="small" />
                                                    ) : (
                                                        <UnfoldMore fontSize="small" />
                                                    )}
                                                    <Typography variant="caption" fontWeight={600} sx={{ ml: 1 }}>Sort</Typography>
                                                </IconButton>
                                            )}
                                        </Box>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHead>
                <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                No podgroups found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                hover
                                onClick={() => handlePodGroupClick(row.original)}
                                sx={{
                                    height: "60px",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        transform: "translateY(-2px)",
                                    },
                                    cursor: "pointer",
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} sx={{ padding: "16px 24px" }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PodGroupsTable;
