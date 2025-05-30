import React from "react";
import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
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
    visibleColumns,
}) => {
    const theme = useTheme();

    const HEADERS = [
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace", hasFilter: true },
        { key: "creationTime", label: "Creation Time", hasSort: true },
        { key: "status", label: "Status", hasFilter: true },
        { key: "age", label: "Age" },
    ].filter((header) => visibleColumns[header.key]);

    return (
        <TableHead>
            <TableRow>
                {HEADERS.map((header) => (
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
                        {header.hasFilter && (
                            <Button
                                size="small"
                                startIcon={<FilterList fontSize="small" />}
                                onClick={(e) =>
                                    handleFilterClick(header.key, e)
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
                                        filters[header.key] !== "All"
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
                                Filter: {filters[header.key]}
                            </Button>
                        )}
                        {header.hasSort && (
                            <Button
                                size="small"
                                onClick={onSortDirectionToggle}
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
                items={["All", "Running", "Pending", "Succeeded", "Failed"]}
                filterType="status"
            />
        </TableHead>
    );
};

TableHeader.propTypes = {
    filters: PropTypes.shape({
        status: PropTypes.string.isRequired,
        namespace: PropTypes.string.isRequired,
    }).isRequired,
    anchorEl: PropTypes.shape({
        status: PropTypes.object,
        namespace: PropTypes.object,
    }).isRequired,
    handleFilterClick: PropTypes.func.isRequired,
    handleFilterClose: PropTypes.func.isRequired,
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    onSortDirectionToggle: PropTypes.func.isRequired,
    sortDirection: PropTypes.oneOf(["asc", "desc"]).isRequired,
    visibleColumns: PropTypes.shape({
        name: PropTypes.bool.isRequired,
        namespace: PropTypes.bool.isRequired,
        creationTime: PropTypes.bool.isRequired,
        status: PropTypes.bool.isRequired,
        age: PropTypes.bool.isRequired,
    }).isRequired,
};

export default TableHeader;
