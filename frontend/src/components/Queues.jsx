import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
    InputAdornment,
} from "@mui/material";
import {
    ArrowDownward,
    ArrowUpward,
    Clear,
    Error,
    FilterList,
    Refresh,
    Search,
    UnfoldMore,
} from "@mui/icons-material";
import axios from "axios";
import { parseCPU, parseMemoryToMi } from "./utils";

const Queues = () => {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: "All",
    });
    const [selectedQueueYaml, setSelectedQueueYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
    });
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalQueues, setTotalQueues] = useState(0);
    const [sortDirection, setSortDirection] = useState("desc");

    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: "asc",
    });

    const fetchQueues = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/queues`, {
                params: {
                    page: pagination.page,
                    limit: pagination.rowsPerPage,
                    search: searchText,
                    state: filters.status,
                },
            });

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = response.data;
            setQueues(data.items || []);
            setTotalQueues(data.totalCount || 0); // 更新 totalQueues
        } catch (err) {
            setError("Failed to fetch queues: " + err.message);
            setQueues([]);
        } finally {
            setLoading(false);
        }
    }, [pagination, searchText, filters]);

    useEffect(() => {
        fetchQueues();
    }, [fetchQueues]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchQueues();
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        fetchQueues();
    }, [fetchQueues]);

    const handleQueueClick = useCallback(async (queue) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/queue/${queue.metadata.name}/yaml`,
                { responseType: "text" },
            );

            const formattedYaml = response.data
                .split("\n")
                .map((line) => {
                    const keyMatch = line.match(/^(\s*)([^:\s]+):/);
                    if (keyMatch) {
                        const [, indent, key] = keyMatch;
                        const value = line.slice(keyMatch[0].length);
                        return `${indent}<span class="yaml-key">${key}</span>:${value}`;
                    }
                    return line;
                })
                .join("\n");

            setSelectedQueueName(queue.metadata.name);
            setSelectedQueueYaml(formattedYaml);
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch queue YAML:", err);
            setError("Failed to fetch queue YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);

    const handleChangePage = useCallback((event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setPagination((prev) => ({
            ...prev,
            rowsPerPage: parseInt(event.target.value, 10),
            page: 1,
        }));
    }, []);

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

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback(
        (filterType, value) => {
            setFilters((prev) => ({ ...prev, [filterType]: value }));
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
            setPagination((prev) => ({ ...prev, page: 1 }));
        },
        [fetchQueues],
    );

    const uniqueStates = useMemo(() => {
        return [
            "All",
            ...new Set(
                queues.map((queue) => queue.status?.state).filter(Boolean),
            ),
        ];
    }, [queues]);

    const sortQueues = useCallback((queues, config) => {
        if (!config.field) return queues;

        return [...queues].sort((a, b) => {
            let aValue, bValue;

            switch (config.field) {
                case "cpu":
                    aValue = parseCPU(a.status?.allocated?.cpu || "0");
                    bValue = parseCPU(b.status?.allocated?.cpu || "0");
                    break;
                case "memory":
                    aValue = parseMemoryToMi(a.status?.allocated?.memory || 0);
                    bValue = parseMemoryToMi(b.status?.allocated?.memory || 0);
                    break;
                case "pods":
                    aValue = Number(a.status?.allocated?.pods) || 0;
                    bValue = Number(b.status?.allocated?.pods) || 0;
                    break;
                case "creationTime":
                    aValue = new Date(a.metadata.creationTimestamp).getTime();
                    bValue = new Date(b.metadata.creationTimestamp).getTime();
                    break;
                default:
                    aValue = a[config.field];
                    bValue = b[config.field];
            }

            if (config.direction === "asc") {
                return aValue > bValue ? 1 : -1;
            }
            return aValue < bValue ? 1 : -1;
        });
    }, []);

    const sortedQueues = useMemo(() => {
        return sortQueues(queues, sortConfig);
    }, [queues, sortConfig, sortQueues]);

    const handleSort = (field) => {
        setSortConfig((prevConfig) => ({
            field,
            direction:
                prevConfig.field === field && prevConfig.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

    const allocatedFields = useMemo(() => {
        const fields = new Set();
        queues.forEach((queue) => {
            if (queue.status?.allocated) {
                Object.keys(queue.status.allocated).forEach((key) => {
                    fields.add(key);
                });
            }
        });
        return Array.from(fields).sort();
    }, [queues]);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <Typography variant="h4" gutterBottom align="left">
                Volcano Queues Status
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                        placeholder="Search queues"
                        variant="outlined"
                        size="small"
                        value={searchText}
                        sx={{ width: 200 }}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconButton
                                        size="small"
                                        onClick={() => fetchQueues()}
                                        sx={{ padding: "4px" }}
                                    >
                                        <Search />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            endAdornment: searchText && (
                                <IconButton
                                    size="small"
                                    onClick={handleClearSearch}
                                    sx={{ padding: "4px" }}
                                >
                                    <Clear />
                                </IconButton>
                            ),
                        }}
                    />
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                >
                    Refresh Queue Status
                </Button>
            </Box>
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

                            {/* get allocated field dynamically */}
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
                                                sortConfig.direction ===
                                                "asc" ? (
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
                                    onClick={(e) =>
                                        handleFilterClick("status", e)
                                    }
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
                                                handleFilterClose(
                                                    "status",
                                                    status,
                                                )
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
                                        boxShadow:
                                            "0px 4px 6px rgba(0, 0, 0, 0.1)",
                                    },
                                    cursor: "pointer",
                                }}
                            >
                                <TableCell>{queue.metadata.name}</TableCell>
                                {allocatedFields.map((field) => (
                                    <TableCell key={field}>
                                        {queue.status?.allocated?.[field] ||
                                            "0"}
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
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Select
                    value={pagination.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    size="small"
                >
                    <MenuItem value={5}>5 per page</MenuItem>
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={20}>20 per page</MenuItem>
                </Select>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 2,
                        mb: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        Total Queues: {totalQueues}
                    </Typography>
                    <Pagination
                        count={Math.ceil(totalQueues / pagination.rowsPerPage)}
                        page={pagination.page}
                        onChange={handleChangePage}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Box>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        width: "80%",
                        maxWidth: "800px",
                        maxHeight: "90vh",
                        m: 2,
                        bgcolor: "background.paper",
                    },
                }}
            >
                <DialogTitle>Queue YAML - {selectedQueueName}</DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            mt: 2,
                            mb: 2,
                            fontFamily: "monospace",
                            fontSize: "1.2rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 150px)",
                            bgcolor: "grey.50",
                            p: 2,
                            borderRadius: 1,
                            "& .yaml-key": {
                                fontWeight: 700,
                                color: "#000",
                            },
                        }}
                    >
                        <pre
                            dangerouslySetInnerHTML={{
                                __html: selectedQueueYaml,
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 2,
                            width: "100%",
                            px: 2,
                            pb: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCloseDialog}
                            sx={{
                                minWidth: "100px",
                                "&:hover": {
                                    bgcolor: "primary.dark",
                                },
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Queues;
