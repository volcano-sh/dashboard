import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { parseCPU, parseMemoryToMi } from "../utils";
import SearchBar from "../Searchbar";
import QueueTable from "./QueueTable/QueueTable";
import QueuePagination from "./QueuePagination";
import QueueYamlDialog from "./QueueYamlDialog";
import TitleComponent from "../Titlecomponent";
import { trpc } from "../../utils/trpc";

const Queues = () => {
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ status: "All" });
    const [selectedQueueYaml, setSelectedQueueYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({ status: null });
    const [searchText, setSearchText] = useState("");
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 });
    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: "asc",
    });

    const queuesQuery = trpc.queueRouter.getQueues.useQuery(
        {
            search: searchText,
            state: filters.status,
            page: pagination.page,
            pageSize: pagination.rowsPerPage,
            sortField: sortConfig.field,
            sortDirection: sortConfig.direction,
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching queues:", err);
                setError(`Queues API error: ${err.message}`);
            },
        },
    );

    const queueYamlQuery = trpc.queueRouter.getQueueYaml.useQuery(
        { name: selectedQueueName },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching queue YAML:", err);
                setError(`Queue YAML API error: ${err.message}`);
            },
        },
    );

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        queuesQuery.refetch();
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        queuesQuery.refetch();
    }, [queuesQuery]);

    const handleQueueClick = useCallback(
        async (queue) => {
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
        },
        [queueYamlQuery],
    );

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleChangePage = (event, newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleChangeRowsPerPage = (event) => {
        setPagination({
            ...pagination,
            rowsPerPage: parseInt(event.target.value, 10),
            page: 1,
        });
    };

    const handleFilterClick = (filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    };

    const handleFilterClose = (filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const uniqueStates = useMemo(() => {
        return [
            "All",
            ...new Set(
                queuesQuery.data?.items
                    ?.map((queue) => queue.status?.state)
                    .filter(Boolean) || [],
            ),
        ];
    }, [queuesQuery.data]);

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
                ? aValue - bValue
                : bValue - aValue;
        });
    }, []);

    const sortedQueues = useMemo(() => {
        return sortQueues(queuesQuery.data?.items || [], sortConfig);
    }, [queuesQuery.data?.items, sortConfig, sortQueues]);

    const handleSort = (field) => {
        setSortConfig((prev) => ({
            field,
            direction:
                prev.field === field && prev.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

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
    }, [queuesQuery.data?.items]);

    const isLoading = queuesQuery.isLoading;
    const isRefreshing = queuesQuery.isRefetching;

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
                    fetchData={queuesQuery.refetch}
                    isRefreshing={isRefreshing}
                    placeholder="Search queues..."
                    refreshLabel="Refresh Queues"
                />
            </Box>
            <QueueTable
                sortedQueues={sortedQueues}
                allocatedFields={allocatedFields}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
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
                totalQueues={queuesQuery.data?.totalCount || 0}
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
