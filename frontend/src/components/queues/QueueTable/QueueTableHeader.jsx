import React from "react";
import {
    TableHead,
    TableRow,
    TableCell,
    Typography,
    Box,
    IconButton,
    Button,
    Menu,
    MenuItem,
    useTheme,
    alpha,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    FilterList,
    UnfoldMore,
} from "@mui/icons-material";

const QueueTableHeader = ({
    allocatedFields,
    handleSort,
    sortConfig,
    filters,
    handleFilterClick,
    anchorEl,
    uniqueStates,
    handleFilterClose,
    setAnchorEl,
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
                        sx={{ letterSpacing: "0.02em" }}
                    >
                        Name
                    </Typography>
                </TableCell>

                {allocatedFields.map((field) => (
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
                                sx={{ letterSpacing: "0.02em" }}
                            >
                                {`Allocated ${field}`}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => handleSort(field)}
                                sx={{
                                    transition:
                                        "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    width: "32px",
                                    height: "32px",
                                    "&:hover": {
                                        color: theme.palette.primary.main,
                                        backgroundColor: alpha(
                                            theme.palette.primary.main,
                                            0.1,
                                        ),
                                        transform: "scale(1.1)",
                                    },
                                }}
                            >
                                {sortConfig.field === field ? (
                                    sortConfig.direction === "asc" ? (
                                        <Tooltip title="Sort by Ascending">
                                            <ArrowUpward fontSize="small" />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="Sort by Descending">
                                            <ArrowDownward fontSize="small" />
                                        </Tooltip>
                                    )
                                ) : (
                                    <Tooltip title={`Sort by ${field}`}>
                                        <UnfoldMore fontSize="small" />
                                    </Tooltip>
                                )}
                            </IconButton>
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
                        sx={{ letterSpacing: "0.02em" }}
                    >
                        Creation Time
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => handleSort("creationTime")}
                        startIcon={
                            sortConfig.field === "creationTime" ? (
                                sortConfig.direction === "asc" ? (
                                    <Tooltip title="Descending">
                                        <ArrowUpward fontSize="small" />
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Ascending">
                                        <ArrowDownward fontSize="small" />
                                    </Tooltip>
                                )
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
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
                        State
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<FilterList fontSize="small" />}
                        onClick={(e) => handleFilterClick("status", e)}
                        sx={{
                            textTransform: "none",
                            padding: "4px 12px",
                            minWidth: "auto",
                            borderRadius: "20px",
                            marginTop: "8px",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            letterSpacing: "0.02em",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            backgroundColor:
                                filters.status !== "All"
                                    ? alpha(theme.palette.primary.main, 0.2)
                                    : alpha(theme.palette.primary.main, 0.1),
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
                        Filter: {filters.status}
                    </Button>
                    <Menu
                        anchorEl={anchorEl.status}
                        open={Boolean(anchorEl.status)}
                        onClose={() =>
                            setAnchorEl((prev) => ({
                                ...prev,
                                status: null,
                            }))
                        }
                        PaperProps={{
                            elevation: 3,
                            sx: {
                                borderRadius: "12px",
                                mt: 1.5,
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                                overflow: "hidden",
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
                                backdropFilter: "blur(10px)",
                            },
                        }}
                    >
                        {uniqueStates.map((status) => (
                            <MenuItem
                                key={status}
                                onClick={() =>
                                    handleFilterClose("status", status)
                                }
                                sx={{
                                    fontSize: "0.875rem",
                                    minHeight: "40px",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: alpha(
                                            theme.palette.primary.main,
                                            0.08,
                                        ),
                                        paddingLeft: "24px",
                                    },
                                    ...(filters.status === status && {
                                        backgroundColor: alpha(
                                            theme.palette.primary.main,
                                            0.12,
                                        ),
                                        fontWeight: 600,
                                        "&::before": {
                                            content: '""',
                                            position: "absolute",
                                            left: "0",
                                            top: "0",
                                            bottom: "0",
                                            width: "3px",
                                            backgroundColor:
                                                theme.palette.primary.main,
                                        },
                                    }),
                                }}
                            >
                                {status}
                            </MenuItem>
                        ))}
                    </Menu>
                </TableCell>
                {/* Added 'Action' column */}
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

export default QueueTableHeader;
