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
import FilterMenu from "./FilterMenu";

const HEADERS = [
    { label: "名称", key: "name" },
    { label: "命名空间", key: "namespace" },
    { label: "创建时间", key: "creationTime" },
    { label: "状态", key: "status" },
    { label: "时长", key: "age" },
];

const STATUS_OPTIONS = [
    { label: "全部", value: "All" },
    { label: "运行中", value: "Running" },
    { label: "等待中", value: "Pending" },
    { label: "已成功", value: "Succeeded" },
    { label: "已失败", value: "Failed" },
];

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

    const getStatusLabel = (value) => {
        const found = STATUS_OPTIONS.find((o) => o.value === value);
        return found ? found.label : value;
    };

    return (
        <TableHead>
            <TableRow>
                {HEADERS.map((h) => (
                    <TableCell
                        key={h.key}
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
                            {h.label}
                        </Typography>
                        {(h.key === "namespace" || h.key === "status") && (
                            <Button
                                size="small"
                                startIcon={<FilterList fontSize="small" />}
                                onClick={(e) => handleFilterClick(h.key, e)}
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
                                        filters[h.key] !== "All"
                                            ? alpha(
                                                  theme.palette.primary.main,
                                                  0.2,
                                              )
                                            : alpha(
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
                                筛选: {getStatusLabel(filters[h.key])}
                            </Button>
                        )}
                        {h.key === "creationTime" && (
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
                                排序
                            </Button>
                        )}
                    </TableCell>
                ))}
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
                items={STATUS_OPTIONS.map((o) => o.label)}
                filterType="status"
            />
        </TableHead>
    );
};

export default TableHeader;
