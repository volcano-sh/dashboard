import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import axios from "axios";
import { parseCPU, parseMemoryToMi } from "../utils"; // Adjust this path based on your project structure
import SearchBar from "../Searchbar";
import QueueTable from "./QueueTable/QueueTable";
import QueuePagination from "./QueuePagination";
import QueueYamlDialog from "./QueueYamlDialog";
import EditQueueDialog from "./QueueTable/EditQueueDialog";
import TitleComponent from "../Titlecomponent";

// Create axios instance with default configuration
const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
    console.log('Starting Request:', request);
    return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('Response:', response);
        return response;
    },
    error => {
        console.error('Response Error:', error);
        return Promise.reject(error);
    }
);

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
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [isEditingQueue, setIsEditingQueue] = useState(false);

    const fetchQueues = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/api/queues`, {
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
            const response = await api.get(
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

            // Store the raw queue object for editing
            setSelectedQueueName(queue.metadata.name);
            setSelectedQueueYaml(formattedYaml);
            
            // Important: Make a deep copy of the queue to avoid reference issues
            setSelectedQueue(JSON.parse(JSON.stringify(queue)));
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

    const handleEditQueue = useCallback(() => {
        setOpenDialog(false);
        setOpenEditDialog(true);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setOpenEditDialog(false);
    }, []);

    // Fixed handleSaveQueue function - properly handles Content-Type and ensures body is sent
    const handleSaveQueue = useCallback(async (updatedQueue) => {
        setIsEditingQueue(true);
        try {
            // Clean and prepare the data
            const queueToUpdate = JSON.parse(JSON.stringify(updatedQueue));
            if (queueToUpdate.status) {
                delete queueToUpdate.status;
            }
            
            console.log("Preparing to update queue:", selectedQueueName);
            console.log("Queue data:", queueToUpdate);
            
            // Use axios directly with explicit configuration
            const response = await axios({
                method: 'PUT',
                url: `/api/queue/${selectedQueueName}`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: queueToUpdate  // This ensures the data is properly serialized
            });
            
            console.log("Success response:", response.data);
            
            // Refresh the queue list
            await fetchQueues();
            
            // Show success notification
            alert(`Queue ${selectedQueueName} updated successfully`);
            
            // Close the edit dialog
            setOpenEditDialog(false);
            
        } catch (err) {
            console.error("Failed to update queue:", err);
            const errorMsg = err.response?.data?.error || err.message || "Unknown error";
            setError("Failed to update queue: " + errorMsg);
            alert("Failed to update queue: " + errorMsg);
        } finally {
            setIsEditingQueue(false);
        }
    }, [selectedQueueName, fetchQueues]);

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
            {error && (
                <Box sx={{ mt: 2, color: "error.main" }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <TitleComponent text="Volcano Queues Status" />
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={handleRefresh}
                    fetchData={fetchQueues}
                    isRefreshing={loading}
                    placeholder="Search queues..."
                    refreshLabel="Refresh Queues"
                />
            </Box>
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
                onEditClick={handleEditQueue}
            />
            {selectedQueue && (
                <EditQueueDialog
                    open={openEditDialog}
                    queue={selectedQueue}
                    onClose={handleCloseEditDialog}
                    onSave={handleSaveQueue}
                />
            )}
        </Box>
    );
};

export default Queues;