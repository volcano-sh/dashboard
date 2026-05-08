import React, { useMemo, useState, useCallback } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    useTheme,
    alpha,
    TableHead,
    Typography,
    Box,
    Button,
    Chip,
} from "@mui/material";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getSortedRowModel,
    getFilteredRowModel,
} from "@tanstack/react-table";
import {
    ArrowDownward,
    ArrowUpward,
    FilterList,
    UnfoldMore,
} from "@mui/icons-material";
import { calculateAge } from "../../utils";
import TableFilterMenu from "../../TableFilterMenu";

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
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
    });

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback(
        (filterType, value) => {
            onFilterChange(filterType, value);
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        },
        [onFilterChange],
    );

    const getStatusColor = useCallback(
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
                    <Chip
                        label={row.original.status?.phase || "Unknown"}
                        sx={{
                            bgcolor: getStatusColor(row.original.status?.phase || "Unknown"),
                            color: "common.white",
                            height: "30px",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            letterSpacing: "0.02em",
                            borderRadius: "15px",
                            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.15)",
                            padding: "0 12px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 5px 10px rgba(0, 0, 0, 0.2)",
                                filter: "brightness(1.05)",
                            },
                        }}
                    />
                ),
            },
            {
                header: "Age",
                id: "age",
                cell: ({ row }) => (
                    <Typography variant="body2" fontWeight={500}>
                        {calculateAge(row.original.metadata.creationTimestamp)}
                    </Typography>
                ),
            },
        ],
        [theme, getStatusColor],
    );

    // Filter logic was previously in PodsTable using useMemo
    // We'll let TanStack Table handle the rendering, but we still use the filtered/sorted data from props
    // if the parent manages it. However, the current code has duplicate filtering logic.
    // I'll use the 'pods' prop directly and let TanStack Table handle the display.
    
    const table = useReactTable({
        data: pods,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

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
                    "&::-webkit-scrollbar": { width: "10px", height: "10px" },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: "5px",
                        "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.3) },
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
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
                                                minWidth: 140,
                                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            }}
                                        >
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ letterSpacing: "0.02em" }}>
                                                    {flexRender(headerText, header.getContext())}
                                                </Typography>
                                                
                                                {isFilterable && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<FilterList fontSize="small" />}
                                                        onClick={(e) => handleFilterClick(headerText.toLowerCase(), e)}
                                                        sx={{
                                                            textTransform: "none",
                                                            padding: "4px 12px",
                                                            minWidth: "auto",
                                                            borderRadius: "20px",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 500,
                                                            backgroundColor: filters[headerText.toLowerCase()] !== "All"
                                                                ? alpha(theme.palette.primary.main, 0.2)
                                                                : alpha(theme.palette.primary.main, 0.1),
                                                            color: theme.palette.primary.main,
                                                            "&:hover": {
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                                                transform: "translateY(-2px)",
                                                            },
                                                        }}
                                                    >
                                                        Filter: {filters[headerText.toLowerCase()]}
                                                    </Button>
                                                )}

                                                {isSortable && (
                                                    <Button
                                                        size="small"
                                                        onClick={onSortDirectionToggle}
                                                        startIcon={
                                                            sortDirection === "desc" ? (
                                                                <ArrowDownward fontSize="small" />
                                                            ) : sortDirection === "asc" ? (
                                                                <ArrowUpward fontSize="small" />
                                                            ) : (
                                                                <UnfoldMore fontSize="small" />
                                                            )
                                                        }
                                                        sx={{
                                                            textTransform: "none",
                                                            padding: "4px 12px",
                                                            minWidth: "auto",
                                                            borderRadius: "20px",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 500,
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                            color: theme.palette.primary.main,
                                                            "&:hover": {
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                                                transform: "translateY(-2px)",
                                                            },
                                                        }}
                                                    >
                                                        Sort
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                hover
                                onClick={() => onPodClick(row.original)}
                                sx={{
                                    height: "60px",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        "& .MuiTableCell-root": { color: theme.palette.primary.main },
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                                        transform: "translateY(-2px)",
                                    },
                                    cursor: "pointer",
                                    "& td": { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} sx={{ padding: "16px 24px" }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TableFilterMenu
                anchorEl={anchorEl.namespace}
                handleFilterClose={handleFilterClose}
                handleFilterClick={handleFilterClick}
                options={allNamespaces}
                filterType="namespace"
                currentValue={filters.namespace}
            />
            <TableFilterMenu
                anchorEl={anchorEl.status}
                handleFilterClose={handleFilterClose}
                handleFilterClick={handleFilterClick}
                options={["All", "Running", "Pending", "Succeeded", "Failed"]}
                filterType="status"
                currentValue={filters.status}
            />
        </React.Fragment>
    );
};

export default PodsTable;
