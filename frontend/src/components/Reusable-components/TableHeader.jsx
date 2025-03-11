import React from "react";
import {
    TableHead,
    TableRow,
    TableCell,
    Typography,
    Button,
    IconButton,
    Box,
    useTheme,
    alpha,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    UnfoldMore,
    FilterList,
} from "@mui/icons-material";

// Optional: fallback menu for simple filter dropdowns
const DefaultFilterMenu = ({
    options = [],
    anchorEl,
    open,
    onClose,
    onSelect,
    selected,
}) => {
    const theme = useTheme();
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={{
                elevation: 3,
                sx: {
                    borderRadius: "12px",
                    mt: 1.5,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
                    backdropFilter: "blur(10px)",
                },
            }}
        >
            {options.map((opt) => (
                <MenuItem
                    key={opt}
                    selected={selected === opt}
                    onClick={() => onSelect(opt)}
                    sx={{
                        fontSize: "0.875rem",
                        minHeight: "40px",
                        ...(selected === opt && {
                            fontWeight: 600,
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.12,
                            ),
                        }),
                        "&:hover": {
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.08,
                            ),
                        },
                    }}
                >
                    {opt}
                </MenuItem>
            ))}
        </Menu>
    );
};

// --- Reusable TableHeader ---
const TableHeader = ({
    columns,
    filters = {},
    anchorEl = {},
    sortConfig = {},
    onSort,
    onFilterClick,
    onFilterClose,
    onFilterSelect,
    filterOptions = {},
    filterMenus = {},
    actionsLabel = "Actions",
}) => {
    const theme = useTheme();

    return (
        <TableHead>
            <TableRow>
                {columns.map((col) => (
                    <TableCell
                        key={col.key}
                        sx={{
                            backgroundColor: alpha(
                                theme.palette.background.paper,
                                0.8,
                            ),
                            backdropFilter: "blur(8px)",
                            padding: "16px 24px",
                            minWidth: 140,
                            borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color="text.primary"
                                sx={{ letterSpacing: "0.02em" }}
                            >
                                {col.label}
                            </Typography>
                            {/* Sorting */}
                            {col.sortable && (
                                <IconButton
                                    size="small"
                                    onClick={() => onSort?.(col.key)}
                                    sx={{
                                        transition:
                                            "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        width: "32px",
                                        height: "32px",
                                        "&:hover": {
                                            color: theme.palette.primary.main,
                                            backgroundColor: alpha(
                                                theme.palette.primary.main,
                                                0.1,
                                            ),
                                            transform: "scale(1.1)",
                                        },
                                    }}
                                >
                                    {sortConfig.field === col.key ? (
                                        sortConfig.direction === "asc" ? (
                                            <ArrowUpward fontSize="small" />
                                        ) : (
                                            <ArrowDownward fontSize="small" />
                                        )
                                    ) : (
                                        <UnfoldMore fontSize="small" />
                                    )}
                                </IconButton>
                            )}
                            {/* Filtering */}
                            {col.filterable && (
                                <Button
                                    size="small"
                                    startIcon={<FilterList fontSize="small" />}
                                    onClick={(e) => onFilterClick(col.key, e)}
                                    sx={{
                                        textTransform: "none",
                                        padding: "4px 12px",
                                        minWidth: "auto",
                                        borderRadius: "20px",
                                        marginTop: "8px",
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                        letterSpacing: "0.02em",
                                        backgroundColor:
                                            filters[col.key] &&
                                            filters[col.key] !== "All"
                                                ? alpha(
                                                      theme.palette.primary
                                                          .main,
                                                      0.2,
                                                  )
                                                : alpha(
                                                      theme.palette.primary
                                                          .main,
                                                      0.1,
                                                  ),
                                        color: theme.palette.primary.main,
                                        "&:hover": {
                                            backgroundColor: alpha(
                                                theme.palette.primary.main,
                                                0.15,
                                            ),
                                            transform: "translateY(-2px)",
                                            boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                                        },
                                    }}
                                >
                                    {`Filter: ${filters[col.key] || "All"}`}
                                </Button>
                            )}
                        </Box>
                        {/* Render filter menu if filterable */}
                        {col.filterable &&
                            (filterMenus?.[col.key] ? (
                                filterMenus[col.key]
                            ) : (
                                <DefaultFilterMenu
                                    options={filterOptions[col.key] || []}
                                    anchorEl={anchorEl[col.key]}
                                    open={Boolean(anchorEl[col.key])}
                                    onClose={() => onFilterClose(col.key)}
                                    onSelect={(opt) =>
                                        onFilterSelect(col.key, opt)
                                    }
                                    selected={filters[col.key]}
                                />
                            ))}
                    </TableCell>
                ))}
                {/* Actions column */}
                <TableCell
                    sx={{
                        backgroundColor: alpha(
                            theme.palette.background.paper,
                            0.8,
                        ),
                        backdropFilter: "blur(8px)",
                        padding: "16px 24px",
                        minWidth: 140,
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        color="text.primary"
                        sx={{ letterSpacing: "0.02em" }}
                    >
                        {actionsLabel}
                    </Typography>
                </TableCell>
            </TableRow>
        </TableHead>
    );
};

export default TableHeader;
