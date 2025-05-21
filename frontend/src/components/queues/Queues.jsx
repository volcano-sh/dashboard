import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import axios from "axios";
import { parseCPU, parseMemoryToMi } from "../utils"; // Adjust this path based on your project structure
import SearchBar from "../Searchbar";
import QueueTable from "./QueueTable/QueueTable";
import QueuePagination from "./QueuePagination";
import QueueYamlDialog from "./QueueYamlDialog";
import TitleComponent from "../Titlecomponent";
import { useContext } from "react";
import { ErrorContext } from "../Layout";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloudIcon from "@mui/icons-material/Cloud";
import RefreshIcon from "@mui/icons-material/Refresh";
import { isBackendAvailable, resetBackendStatus } from "../../App";


const EmptyState = ({ message, icon, isError = false, onRetry = null }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 5,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: isError ? "#FFF5F5" : "#F9F9F9",
                border: isError ? "1px solid #FFCDD2" : "1px solid #EEEEEE",
                my: 3,
            }}
        >
            <Box sx={{ mb: 2 }}>
                {icon || (isError ? (
                    <ErrorOutlineIcon sx={{ fontSize: 60, color: isError ? "#F44336" : "#9E9E9E" }} />
                ) : (
                    <CloudIcon sx={{ fontSize: 60, color: "#9E9E9E" }} />
                ))}
            </Box>
            <Typography variant="h6" color={isError ? "error" : "textSecondary"} gutterBottom>
                {isError ? "Connection Error" : "No Data Available"}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 500, mx: "auto", mb: 3 }}>
                {message}
            </Typography>
            {onRetry && (
                <Button
                    variant="contained"
                    color={isError ? "error" : "primary"}
                    startIcon={<RefreshIcon />}
                    onClick={onRetry}
                >
                    Retry Connection
                </Button>
            )}
        </Paper>
    );
};

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
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalQueues, setTotalQueues] = useState(0);
    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: "asc",
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { setError: setGlobalError, clearError: clearGlobalError } = useContext(ErrorContext);

    const fetchQueues = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && !isBackendAvailable()) {
        console.log("Skipping fetch - backend unavailable");
        return;
    }
        setLoading(true);
        setError(null);
        setIsRefreshing(true);

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
            setTotalQueues(data.totalCount || 0);
            
            setError(null);
            clearGlobalError();
        } catch (err) {
            const errorMessage = "Failed to fetch queues: " + err.message;
            setError(errorMessage);
            setQueues([]);
            
            if (err.response && err.response.status === 500) {
                setGlobalError("The Volcano API is currently unavailable. We're working to restore service.", "error");
            }
            } finally {
                setLoading(false);
                setIsRefreshing(false);
            }
    }, [pagination, searchText, filters, setGlobalError]);

    useEffect(() => {
        fetchQueues();
    }, []);

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
        resetBackendStatus();
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        fetchQueues(true);
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

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

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
            <TitleComponent text="Volcano Queues Status" />
            
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={handleRefresh}
                    fetchData={fetchQueues}
                    isRefreshing={isRefreshing}
                    placeholder="Search queues..."
                    refreshLabel="Refresh Queues"
                    error={error}

                />
            </Box>
            
            {error ? (
                <EmptyState 
                    message={error.includes("status code 500") 
                        ? "We're having trouble connecting to the Volcano API. This could be due to maintenance or temporary server issues." 
                        : error
                    }
                    isError={true}
                    onRetry={handleRefresh}
                />
            ) : loading && queues.length === 0 ? (
                // Custom loading state when there's no data
                <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body1" color="textSecondary">
                        Loading queue data...
                    </Typography>
                </Box>
            ) : queues.length === 0 ? (
                // Empty state when no queues match filters
                <EmptyState 
                    message="No queues found matching your current filters."
                    onRetry={handleRefresh}
                />
            ) : (
                // Table view when we have queues
                <>
                    <QueueTable
                        sortedQueues={sortedQueues}
                        allocatedFields={allocatedFields}
                        handleQueueClick={handleQueueClick}
                        handleSort={handleSort}
                        sortConfig={sortConfig}
                        filters={filters}
                        handleFilterClick={handleFilterClick}
                        anchorEl={anchorEl}
                        uniqueStates={uniqueStates}
                        handleFilterClose={handleFilterClose}
                        setAnchorEl={setAnchorEl}
                    />
                    <QueuePagination
                        pagination={pagination}
                        totalQueues={totalQueues}
                        handleChangeRowsPerPage={handleChangeRowsPerPage}
                        handleChangePage={handleChangePage}
                    />
                    <QueueYamlDialog
                        openDialog={openDialog}
                        handleCloseDialog={handleCloseDialog}
                        selectedQueueName={selectedQueueName}
                        selectedQueueYaml={selectedQueueYaml}
                    />
                </>
            )}
        </Box>
);

};

export default Queues;
