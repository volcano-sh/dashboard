import {
    ArrowDownward,
    ArrowUpward,
    Clear,
    FilterList,
    Refresh,
    Search,
    UnfoldMore,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
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
    useTheme
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import { trpc } from "../utils/trpc";

const Queues = () => {
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
    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: "asc",
    });
    const [error, setError] = useState(null);

    const queuesQuery = trpc.queueRouter.getAllQueues.useQuery(
        {
            search: searchText,
            state: filters.status,
            page: pagination.page,
            pageSize: pagination.rowsPerPage,
            sortField: sortConfig.field,
            sortDirection: sortConfig.direction
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching queues:", err);
                setError(`Queues API error: ${err.message}`);
            }
        }
    );

    const queueYamlQuery = trpc.queueRouter.getQueueYaml.useQuery(
        { name: selectedQueueName },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching queue YAML:", err);
                setError(`Queue YAML API error: ${err.message}`);
            }
        }
    );

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleRefresh = useCallback(() => {
        setError(null);
        queuesQuery.refetch();
    }, [queuesQuery]);

    const handleQueueClick = useCallback(async (queue) => {
        try {
            setSelectedQueueName(queue.metadata.name);
            const response = await queueYamlQuery.refetch();

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

            setSelectedQueueYaml(formattedYaml);
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch queue YAML:", err);
            setError("Failed to fetch queue YAML: " + err.message);
        }
    }, [queueYamlQuery]);

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
        [],
    );

    const uniqueStates = useMemo(() => {
        return [
            "All",
            ...new Set(queuesQuery.data?.items?.map((queue) => queue.status?.state).filter(Boolean) || []),
        ];
    }, [queuesQuery.data]);

    const handleSort = useCallback((field) => {
        setSortConfig((prevConfig) => ({
            field,
            direction:
                prevConfig.field === field && prevConfig.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    }, []);

    const allocatedFields = useMemo(() => {
        const fields = new Set();
        queuesQuery.data?.items?.forEach((queue) => {
            if (queue.status?.allocated) {
                Object.keys(queue.status.allocated).forEach((key) => {
                    fields.add(key);
                });
            }
        });
        return Array.from(fields).sort();
    }, [queuesQuery.data]);

    const isLoading = queuesQuery.isLoading;
    const isRefreshing = queuesQuery.isRefetching;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Paper
                    sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: "error.light",
                        color: "error.contrastText",
                    }}
                >
                    <Typography>{error}</Typography>
                </Paper>
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
                        onChange={handleSearch}
                        sx={{ width: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconButton
                                        size="small"
                                        onClick={() => queuesQuery.refetch()}
                                        disabled={isRefreshing}
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
                    disabled={isRefreshing}
                >
                    Refresh Queue Status
                </Button>
            </Box>
            <TableContainer
                component={Paper}
                sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
            >
                {isLoading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: "200px",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
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
                            {queuesQuery.data?.items?.map((queue) => (
                                <TableRow
                                    key={queue.metadata.name}
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
                                    onClick={() => handleQueueClick(queue)}
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
                )}
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
                        Total Queues: {queuesQuery.data?.totalCount || 0}
                    </Typography>
                    <Pagination
                        count={Math.ceil((queuesQuery.data?.totalCount || 0) / pagination.rowsPerPage)}
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
