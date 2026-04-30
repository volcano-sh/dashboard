import React from "react";
import {
    alpha,
    Box,
    Button,
    Menu,
    MenuItem,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
    useTheme,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

const SchedulingHeaderFilter = ({ filter }) => {
    if (!filter) return null;

    const active = filter.value && filter.value !== "All";

    return (
        <>
            <Button
                onClick={filter.onOpen}
                size="small"
                startIcon={<FilterListIcon sx={{ fontSize: 14 }} />}
                sx={(theme) => ({
                    bgcolor: active
                        ? alpha(theme.palette.primary.main, 0.14)
                        : alpha(theme.palette.primary.main, 0.08),
                    borderRadius: 999,
                    color: theme.palette.primary.main,
                    fontSize: 11.5,
                    fontWeight: 600,
                    lineHeight: 1,
                    minWidth: 0,
                    px: 1,
                    py: 0.6,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    "& .MuiButton-startIcon": {
                        mr: 0.5,
                    },
                    "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                    },
                })}
            >
                {filter.value || "All"}
            </Button>
            <Menu
                anchorEl={filter.anchorEl}
                onClose={() => filter.onSelect(filter.value || "All")}
                open={Boolean(filter.anchorEl)}
            >
                {(filter.options || []).map((option) => (
                    <MenuItem
                        key={option}
                        onClick={() => filter.onSelect(option)}
                        selected={option === filter.value}
                    >
                        {option}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

const SchedulingHeaderLabel = ({ column }) => {
    const label = (
        <Typography
            color="text.primary"
            component="span"
            sx={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
            }}
        >
            {column.label}
        </Typography>
    );

    if (!column.sortable) return label;

    return (
        <TableSortLabel
            active
            direction={column.sortDirection || "desc"}
            onClick={column.onSort}
            sx={{
                "& .MuiTableSortLabel-icon": {
                    fontSize: 16,
                    ml: 0.4,
                },
            }}
        >
            {label}
        </TableSortLabel>
    );
};

const SchedulingTableHeader = ({ columns }) => {
    const theme = useTheme();

    return (
        <TableHead>
            <TableRow>
                {columns.map((column) => (
                    <TableCell
                        key={column.key || column.label}
                        sx={{
                            backgroundColor: "#f7f8fa",
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            minWidth: column.minWidth,
                            px: 2.25,
                            py: 1.55,
                            width: column.width,
                        }}
                    >
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                flexWrap: "nowrap",
                                gap: 0.9,
                                justifyContent: column.align === "right"
                                    ? "flex-end"
                                    : "flex-start",
                                minHeight: 28,
                            }}
                        >
                            <SchedulingHeaderLabel column={column} />
                            <SchedulingHeaderFilter filter={column.filter} />
                        </Box>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

export default SchedulingTableHeader;
