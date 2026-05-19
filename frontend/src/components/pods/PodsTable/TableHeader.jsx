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
import {
    ArrowDownward,
    ArrowUpward,
    FilterList,
    UnfoldMore,
} from "@mui/icons-material";
import JobFilters from "../../jobs/JobTable/JobFilters";
import { translations } from "../../../config/translations";

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

    const getFilterLabel = (value) => {
        if (value === null || value === undefined) return "";
        if (value === "All") return `${translations.zh.filter}: ${translations.zh.all}`;
        if (value === "default") return `${translations.zh.filter}: ${translations.zh.default}`;
        if (typeof value === "string") {
            const key = value.toLowerCase();
            return `${translations.zh.filter}: ${translations.zh[key] || value}`;
        }
        return `${translations.zh.filter}: ${String(value)}`;
    };

    return (
        <TableHead>
            <TableRow>
                {[
                    { key: "name", label: translations.zh.name },
                    { key: "namespace", label: translations.zh.namespace },
                    { key: "creationTime", label: translations.zh.creationTime },
                    { key: "status", label: translations.zh.status },
                    { key: "age", label: translations.zh.age }
                ].map(
                    (header) => (
                        <TableCell
                            key={header.key}
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
                                {header.label}
                            </Typography>
                            {(header.key === "namespace" ||
                                header.key === "status") && (
                                <Button
                                    size="small"
                                    startIcon={<FilterList fontSize="small" />}
                                    onClick={(e) =>
                                        handleFilterClick(
                                            header.key,
                                            e,
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
                                        backgroundColor:
                                            filters[header.key] !==
                                            "All"
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
                                            boxShadow: `0 4px 8px ${alpha(
                                                theme.palette.primary.main,
                                                0.2,
                                            )}`,
                                        },
                                    }}
                                >
                                    {getFilterLabel(filters[header.key])}
                                </Button>
                            )}
                            {header.key === "creationTime" && (
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
                                    {translations.zh.sort}
                                </Button>
                            )}
                        </TableCell>
                    ),
                )}
            </TableRow>
            <JobFilters
                filterType="namespace"
                currentValue={filters.namespace}
                options={allNamespaces}
                handleFilterClick={handleFilterClick}
                handleFilterClose={handleFilterClose}
                anchorEl={anchorEl.namespace}
            />
            <JobFilters
                filterType="status"
                currentValue={filters.status}
                options={["All", "Running", "Pending", "Succeeded", "Failed"]}
                handleFilterClick={handleFilterClick}
                handleFilterClose={handleFilterClose}
                anchorEl={anchorEl.status}
            />
        </TableHead>
    );
};

export default TableHeader;
