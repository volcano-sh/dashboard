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
import {
    ArrowDownward,
    ArrowUpward,
    UnfoldMore,
    FilterList,
} from "@mui/icons-material";
import JobFilters from "../../jobs/JobTable/JobFilters";

const PodGroupsTableHeader = ({
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

    const getFilterButtonStyle = (isActive) => ({
        textTransform: "none",
        padding: "4px 12px",
        minWidth: "auto",
        borderRadius: "20px",
        fontSize: "0.8rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        backgroundColor: isActive
            ? alpha(theme.palette.primary.main, 0.2)
            : alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
            transform: "translateY(-2px)",
        },
    });

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
                            Namespace
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<FilterList fontSize="small" />}
                            onClick={(e) => handleFilterClick("namespace", e)}
                            sx={getFilterButtonStyle(
                                filters.namespace !== "All",
                            )}
                        >
                            {filters.namespace}
                        </Button>
                        <JobFilters
                            filterType="namespace"
                            currentValue={filters.namespace}
                            options={allNamespaces}
                            handleFilterClick={handleFilterClick}
                            handleFilterClose={handleFilterClose}
                            anchorEl={anchorEl.namespace}
                        />
                    </Box>
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
                        Min Member
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
                            Status
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<FilterList fontSize="small" />}
                            onClick={(e) => handleFilterClick("status", e)}
                            sx={getFilterButtonStyle(filters.status !== "All")}
                        >
                            {filters.status}
                        </Button>
                        <JobFilters
                            filterType="status"
                            currentValue={filters.status}
                            options={uniqueStatuses}
                            handleFilterClick={handleFilterClick}
                            handleFilterClose={handleFilterClose}
                            anchorEl={anchorEl.status}
                        />
                    </Box>
                </TableCell>
            </TableRow>
        </TableHead>
    );
};

export default PodGroupsTableHeader;
