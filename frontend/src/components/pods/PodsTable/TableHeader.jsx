import React from "react";
import Tooltip from '@mui/material/Tooltip';
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

    return (
        <TableHead>
            <TableRow>
                {["Name", "Namespace", "Creation Time", "Status", "Age"].map(
                    (header) => (
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
                            {(header === "Namespace" ||
                                header === "Status") && (
                                <Button
                                    size="small"
                                    startIcon={<FilterList fontSize="small" />}
                                    onClick={(e) =>
                                        handleFilterClick(
                                            header.toLowerCase(),
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
                                            filters[header.toLowerCase()] !==
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
                                    Filter: {filters[header.toLowerCase()]}
                                </Button>
                            )}
                            {header === "Creation Time" && (
                                <Button
                                    size="small"
                                    onClick={onSortDirectionToggle}
                                    startIcon={
                                        sortDirection === "desc" ? (
                                            <Tooltip title="ascending" >
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
