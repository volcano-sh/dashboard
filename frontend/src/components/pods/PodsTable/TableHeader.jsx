import React from "react";
import {
    TableHead,
    TableRow,
    TableCell,
    Button,
    Typography,
    useTheme,
    alpha,
    Box,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    FilterList,
    UnfoldMore,
} from "@mui/icons-material";
import FilterMenu from "./FilterMenu";

const TableHeader = ({
    filters,
    anchorEl,
    handleFilterClick,
    handleFilterClose,
    allNamespaces,
    onSortDirectionToggle,
    sortDirection,
}) => {
    const theme = useTheme();
    const headerConfig = [
        { label: "Name", key: "name", minWidth: 200 },
        {
            label: "Namespace",
            key: "namespace",
            minWidth: 290,
            filterable: true,
        },
        {
            label: "Creation Time",
            key: "creationTime",
            minWidth: 250,
            sortable: true,
        },
        { label: "Status", key: "status", minWidth: 250, filterable: true },
        { label: "Age", key: "age", minWidth: 100 },
    ];

    return (
        <TableHead>
            <TableRow>
                {headerConfig.map(
                    ({ label, key, minWidth, filterable, sortable }) => (
                        <TableCell
                            key={label}
                            sx={{
                                backgroundColor: alpha(
                                    theme.palette.background.paper,
                                    0.8,
                                ),
                                backdropFilter: "blur(8px)",
                                padding: "16px 24px",
                                minWidth,
                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight="700"
                                    color="text.primary"
                                    sx={{ letterSpacing: "0.02em" }}
                                >
                                    {label}
                                </Typography>

                                {filterable && (
                                    <Button
                                        size="small"
                                        startIcon={
                                            <FilterList fontSize="small" />
                                        }
                                        onClick={(e) =>
                                            handleFilterClick(key, e)
                                        }
                                        sx={{
                                            textTransform: "none",
                                            padding: "4px 12px",
                                            minWidth: "auto",
                                            borderRadius: "20px",
                                            fontSize: "0.8rem",
                                            fontWeight: 500,
                                            letterSpacing: "0.02em",
                                            backgroundColor:
                                                filters[key] !== "All"
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
                                        Filter: {filters[key]}
                                    </Button>
                                )}

                                {sortable && (
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
                                            letterSpacing: "0.02em",
                                            backgroundColor: alpha(
                                                theme.palette.primary.main,
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
                                        Sort
                                    </Button>
                                )}
                            </Box>
                        </TableCell>
                    ),
                )}
            </TableRow>

            {/* Filter Menus */}
            <FilterMenu
                anchorEl={anchorEl.namespace}
                handleClose={handleFilterClose}
                items={allNamespaces}
                filterType="namespace"
            />
            <FilterMenu
                anchorEl={anchorEl.status}
                handleClose={handleFilterClose}
                items={["All", "Running", "Pending", "Succeeded", "Failed"]}
                filterType="status"
            />
        </TableHead>
    );
};

export default TableHeader;
