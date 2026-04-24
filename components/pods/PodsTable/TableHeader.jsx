import React from "react";
import {
    TableHead,
    TableRow,
    TableCell,
    Button,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import { ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";

const TableHeader = ({ filters, onSortDirectionToggle, sortDirection }) => {
    const theme = useTheme();

    return (
        <TableHead>
            <TableRow>
                {[
                    "Name",
                    "Namespace",
                    "Queue",
                    "Creation Time",
                    "Status",
                    "Age",
                ].map((header) => (
                    <TableCell
                        key={header}
                        sx={{
                            backgroundColor: alpha(
                                theme.palette.background.paper,
                                0.8,
                            ),
                            backdropFilter: "blur(8px)",
                            padding: "16px 24px",
                            minWidth: 140,
                            borderBottom: `2px solid ${alpha(
                                theme.palette.primary.main,
                                0.2,
                            )}`,
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            fontWeight="700"
                            color="text.primary"
                            sx={{ letterSpacing: "0.02em" }}
                        >
                            {header}
                        </Typography>
                        {header === "Creation Time" && (
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
                                    marginTop: "8px",
                                    fontSize: "0.8rem",
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
                                    transition:
                                        "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
                                        boxShadow: `0 4px 8px ${alpha(
                                            theme.palette.primary.main,
                                            0.2,
                                        )}`,
                                    },
                                }}
                            >
                                Sort
                            </Button>
                        )}
                        {header === "Namespace" &&
                            filters.namespace !== "All" && (
                                <Typography
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontSize: 12,
                                        mt: 0.75,
                                    }}
                                >
                                    {filters.namespace}
                                </Typography>
                            )}
                        {header === "Queue" && filters.queue !== "All" && (
                            <Typography
                                sx={{
                                    color: theme.palette.primary.main,
                                    fontSize: 12,
                                    mt: 0.75,
                                }}
                            >
                                {filters.queue}
                            </Typography>
                        )}
                        {header === "Status" && filters.status !== "All" && (
                            <Typography
                                sx={{
                                    color: theme.palette.primary.main,
                                    fontSize: 12,
                                    mt: 0.75,
                                }}
                            >
                                {filters.status}
                            </Typography>
                        )}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

export default TableHeader;
