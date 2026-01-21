import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import { parseCPU, parseMemoryToMi } from "../utils";
import SearchBar from "../Searchbar";
import QueueTable from "./QueueTable/QueueTable";
import QueuePagination from "./QueuePagination";
import QueueYamlDialog from "./QueueYamlDialog";
import TitleComponent from "../Titlecomponent";

const Queues = () => {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ status: "All" });
    const [selectedQueueYaml, setSelectedQueueYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({ status: null });
    const [searchText, setSearchText] = useState("");
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 });
    const [totalQueues, setTotalQueues] = useState(0);
    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: "asc",
    });

    // 🟢 1. Fetch all queues
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

    // Create Queue handler for SearchBar
    const handleCreateQueue = async (newQueue) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/queues", newQueue);

            if (response.status !== 201) {
                let errMsg = response.data?.error || response.statusText;
                alert("Failed to create queue: " + errMsg);
                return;
            }

            alert("Queue created successfully!");
        } catch (err) {
            alert(
                "Network error: " + (err?.response?.data?.error || err.message),
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback((event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

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
            return config.direction === "asc"
                ? aValue > bValue
                    ? 1
                    : -1
                : aValue < bValue
                  ? 1
                  : -1;
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
        <Box
            sx={{
                bgcolor: "background.default",
                minHeight: "100vh",
                px: { xs: 0, sm: 3 },
                py: { xs: 0, sm: 3 },
                width: "100%",
                overflow: "hidden",
                maxWidth: "100vw",
            }}
        >
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
                    createlabel="Create Queue"
                    onCreateClick={handleCreateQueue}
                    dialogTitle="Create a Queue"
                    dialogResourceNameLabel="Queue Name"
                    dialogResourceType="Queue"
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
            />
        </Box>
    );
};

export default Queues;
