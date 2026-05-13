import React from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();

    const headers = [
        { key: "name", label: t("common.name") },
        { key: "namespace", label: t("common.namespace") },
        { key: "creationTime", label: t("common.creationTime") },
        { key: "status", label: t("common.status") },
        { key: "age", label: t("pods.age") },
    ];

    return (
        <TableHead>
            <TableRow>
                {headers.map(
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
                                    {t("common.filterLabel", { value: filters[header.key] })}
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
                                    {t("common.sort")}
                                </Button>
                            )}
                        </TableCell>
                    ),
                )}
            </TableRow>
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
