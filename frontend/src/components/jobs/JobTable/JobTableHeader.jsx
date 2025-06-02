import React from "react";
import {
    TableHead,
    TableRow,
    TableCell,
    Typography,
    Button,
    Box,
    useTheme,
    alpha,
    Menu,
    MenuItem,
} from "@mui/material";
import { ArrowDownward, ArrowUpward, UnfoldMore, FilterList } from "@mui/icons-material";

const JobTableHeader = ({
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

    const renderFilterButton = (filterType, currentValue, options, anchorElForFilter) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Button
                size="small"
                variant="outlined"
                onClick={(event) => handleFilterClick(filterType, event)}
                startIcon={<FilterList fontSize="small" />}
                sx={{
                    textTransform: "none",
                    padding: "4px 12px",
                    minWidth: "auto",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        borderColor: theme.palette.primary.main,
                        transform: "translateY(-2px)",
                    },
                }}
            >
                {currentValue === "All" ? "Filter" : currentValue}
            </Button>
            <Menu
                anchorEl={anchorElForFilter}
                open={Boolean(anchorElForFilter)}
                onClose={() => handleFilterClose(filterType, currentValue)}
                PaperProps={{
                    sx: {
                        maxHeight: 300,
                        minWidth: 150,
                        borderRadius: 2,
                        boxShadow: theme.shadows[8],
                    },
                }}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option}
                        onClick={() => handleFilterClose(filterType, option)}
                        selected={currentValue === option}
                        sx={{
                            "&.Mui-selected": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                },
                            },
                        }}
                    >
                        {option}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );

    return (
        <TableHead>
            <TableRow>
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
                    >
                        Name
                    </Typography>
                </TableCell>

                <TableCell
                    sx={{
                        backgroundColor: alpha(
                            theme.palette.background.paper,
                            0.8,
                        ),
                        backdropFilter: "blur(8px)",
                        padding: "16px 24px",
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        color="text.primary"
                    >
                        Namespace
                    </Typography>
                    {renderFilterButton("namespace", filters.namespace, ["All", ...allNamespaces], anchorEl.namespace)}
                </TableCell>

                <TableCell
                    sx={{
                        backgroundColor: alpha(
                            theme.palette.background.paper,
                            0.8,
                        ),
                        backdropFilter: "blur(8px)",
                        padding: "16px 24px",
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        color="text.primary"
                    >
                        Queue
                    </Typography>
                    {renderFilterButton("queue", filters.queue, ["All", ...allQueues], anchorEl.queue)}
                </TableCell>

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
                    >
                        Creation Time
                    </Typography>
                    <Button
                        size="small"
                        onClick={toggleSortDirection}
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
                            marginTop: "8px",
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
                            },
                        }}
                    >
                        Sort
                    </Button>
                </TableCell>

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
                    >
                        Status
                    </Typography>
                    {renderFilterButton("status", filters.status, uniqueStatuses, anchorEl.status)}
                </TableCell>

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
                        Actions
                    </Typography>
                </TableCell>
            </TableRow>
        </TableHead>
    );
};

export default JobTableHeader;
