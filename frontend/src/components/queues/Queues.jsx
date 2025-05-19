import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import { parseCPU, parseMemoryToMi } from "../utils"; // Adjust this path based on your project structure
import SearchBar from "../Searchbar";
import QueueTable from "./QueueTable/QueueTable";
import QueuePagination from "./QueuePagination";
import QueueYamlDialog from "./QueueYamlDialog";
import TitleComponent from "../Titlecomponent";
import QueueGridView from "./QueueTable/QueueGridView";

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
    // New state for view mode
    const [viewMode, setViewMode] = useState("table"); // "table" or "grid"

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

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    // New handler for toggling view mode
    const handleToggleViewMode = (mode) => {
        setViewMode(mode);
    };

    // New handler for exporting queues data
    const handleExportQueues = () => {
        exportQueuesData(sortedQueues);
    };

    // New function to export queues data as CSV
    const exportQueuesData = (queues) => {
        // Create a simplified version of the queues data for export
        const exportData = queues.map(queue => {
            return {
                name: queue.metadata?.name || '',
                namespace: queue.metadata?.namespace || 'default',
                state: queue.status?.state || 'Unknown',
                cpu: queue.status?.allocated?.cpu || 'N/A',
                memory: queue.status?.allocated?.memory || 'N/A',
                pods: queue.status?.allocated?.pods || 'N/A',
                creationTime: queue.metadata?.creationTimestamp || ''
            };
        });

        // Convert data to CSV format
        const headers = ["Name", "Namespace", "State", "CPU", "Memory", "Pods", "Creation Time"];
        const csvContent = [
            headers.join(","),
            ...exportData.map(row => 
                [
                    row.name,
                    row.namespace,
                    row.state,
                    row.cpu,
                    row.memory,
                    row.pods,
                    new Date(row.creationTime).toLocaleString()
                ].join(",")
            )
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `volcano-queues-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                    isRefreshing={false} // Update if needed
                    placeholder="Search queues..."
                    refreshLabel="Refresh Queues"
                />
            </Box>
            
            {/* Conditional rendering based on view mode */}
            {viewMode === "table" ? (
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
            ) : (
                <QueueGridView 
                    queues={sortedQueues} 
                    handleQueueClick={handleQueueClick} 
                />
            )}
            
            <QueuePagination
                pagination={pagination}
                totalQueues={totalQueues}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                handleChangePage={handleChangePage}
                onExportQueues={handleExportQueues}  // New prop
                onToggleViewMode={handleToggleViewMode}  // New prop
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