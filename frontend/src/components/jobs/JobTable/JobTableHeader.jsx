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
} from "@mui/material";
import { ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";
import JobFilters from "./JobFilters";

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

                {["Namespace", "Queue"].map((field) => (
                    <TableCell
                        key={field}
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
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight="700"
                                color="text.primary"
                            >
                                {field}
                            </Typography>
                            <JobFilters
                                filterType={field.toLowerCase()}
                                currentValue={filters[field.toLowerCase()]}
                                options={
                                    field === "Namespace"
                                        ? allNamespaces
                                        : allQueues
                                }
                                handleFilterClick={handleFilterClick}
                                handleFilterClose={handleFilterClose}
                                anchorEl={anchorEl[field.toLowerCase()]}
                            />
                        </Box>
                    </TableCell>
                ))}

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
                                        <Tooltip title="ascending">
                                            <ArrowDownward fontSize="small" />
                                        </Tooltip>
                                    ) : sortDirection === "asc" ? (
                                        <Tooltip title="descending">
                                            <ArrowUpward fontSize="small" />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="Sort by Creation Time">
                                            <UnfoldMore fontSize="small" />
                                        </Tooltip>
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
                    <JobFilters
                        filterType="status"
                        currentValue={filters.status}
                        options={uniqueStatuses}
                        handleFilterClick={handleFilterClick}
                        handleFilterClose={handleFilterClose}
                        anchorEl={anchorEl.status}
                    />
                </TableCell>

                {/* New Actions Column */}
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
