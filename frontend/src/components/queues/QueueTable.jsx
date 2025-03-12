import React, { useCallback } from 'react';
import { 
    TableContainer, 
    Table, 
    TableHead, 
    TableBody, 
    TableRow, 
    TableCell, 
    Paper, 
    Typography, 
    Box, 
    IconButton, 
    Button, 
    Menu, 
    MenuItem, 
    Chip,
    useTheme
} from '@mui/material';
import { 
    ArrowDownward, 
    ArrowUpward, 
    FilterList, 
    UnfoldMore 
} from '@mui/icons-material';

const QueueTable = ({ 
    sortedQueues, 
    allocatedFields, 
    handleQueueClick, 
    handleSort, 
    sortConfig, 
    filters, 
    handleFilterClick, 
    anchorEl, 
    uniqueStates, 
    handleFilterClose,
    setAnchorEl
}) => {
    const theme = useTheme();

    const getStateColor = useCallback(
        (status) => {
            switch (status) {
                case "Open":
                    return theme.palette.success.main;
                case "Closing":
                    return theme.palette.warning.main;
                case "Closed":
                    return theme.palette.info.main;
                default:
                    return theme.palette.grey[500];
            }
        },
        [theme],
    );

    return (
        <TableContainer
            component={Paper}
            sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
        >
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell
                            sx={{
                                backgroundColor: "background.paper",
                                padding: "8px 16px",
                                minWidth: 120,
                            }}
                        >
                            <Typography variant="h6">Name</Typography>
                        </TableCell>

                        {allocatedFields.map((field) => (
                            <TableCell key={field}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography variant="h6">{`Allocated ${field}`}</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleSort(field)}
                                    >
                                        {sortConfig.field === field ? (
                                            sortConfig.direction === "asc" ? (
                                                <ArrowUpward />
                                            ) : (
                                                <ArrowDownward />
                                            )
                                        ) : (
                                            <UnfoldMore />
                                        )}
                                    </IconButton>
                                </Box>
                            </TableCell>
                        ))}

                        <TableCell
                            sx={{
                                backgroundColor: "background.paper",
                                padding: "8px 16px",
                                minWidth: 120,
                            }}
                        >
                            <Typography variant="h6">
                                Creation Time
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => handleSort("creationTime")}
                                startIcon={
                                    sortConfig.field === "creationTime" ? (
                                        sortConfig.direction === "asc" ? (
                                            <ArrowUpward />
                                        ) : (
                                            <ArrowDownward />
                                        )
                                    ) : (
                                        <UnfoldMore />
                                    )
                                }
                                sx={{
                                    textTransform: "none",
                                    padding: 0,
                                    minWidth: "auto",
                                }}
                            >
                                Sort
                            </Button>
                        </TableCell>
                        <TableCell
                            sx={{
                                backgroundColor: "background.paper",
                                padding: "8px 16px",
                                minWidth: 120,
                            }}
                        >
                            <Typography variant="h6">State</Typography>
                            <Button
                                size="small"
                                startIcon={<FilterList />}
                                onClick={(e) => handleFilterClick("status", e)}
                                sx={{
                                    textTransform: "none",
                                    padding: 0,
                                    minWidth: "auto",
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
                            >
                                {uniqueStates.map((status) => (
                                    <MenuItem
                                        key={status}
                                        onClick={() =>
                                            handleFilterClose("status", status)
                                        }
                                    >
                                        {status}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedQueues.map((queue) => (
                        <TableRow
                            hover
                            key={queue.metadata.name}
                            onClick={() => handleQueueClick(queue)}
                            sx={{
                                "&:nth-of-type(odd)": {
                                    bgcolor: "action.hover",
                                },
                                "&:hover": {
                                    bgcolor: "action.hover",
                                    color: "primary.main",
                                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                                },
                                cursor: "pointer",
                            }}
                        >
                            <TableCell>{queue.metadata.name}</TableCell>
                            {allocatedFields.map((field) => (
                                <TableCell key={field}>
                                    {queue.status?.allocated?.[field] || "0"}
                                </TableCell>
                            ))}
                            <TableCell>
                                {new Date(
                                    queue.metadata.creationTimestamp,
                                ).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={
                                        queue.status
                                            ? queue.status.state
                                            : "Unknown"
                                    }
                                    sx={{
                                        bgcolor: getStateColor(
                                            queue.status
                                                ? queue.status.state
                                                : "Unknown",
                                        ),
                                        color: "common.white",
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default QueueTable;