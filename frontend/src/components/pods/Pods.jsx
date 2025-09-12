import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import axios from "axios";
import SearchBar from "../Searchbar";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces } from "../utils";
import PodsTable from "./PodsTable/PodsTable";
import PodsPagination from "./PodsPagination";
import PodDetailsDialog from "./PodDetailsDialog";
import { useEvent } from "../../contexts/EventContext";

const Pods = () => {
    const [pods, setPods] = useState([]);
    const [cachedPods, setCachedPods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allNamespaces, setAllNamespaces] = useState([]);
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "default",
    });
    const [selectedPodYaml, setSelectedPodYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedPodName, setSelectedPodName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalPods, setTotalPods] = useState(0);
    const [sortDirection, setSortDirection] = useState("");
    const { onUpdateEvent } = useEvent();

    const fetchPods = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/pods`, {
                params: {
                    search: searchText,
                    namespace: filters.namespace,
                    status: filters.status,
                },
            });

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = response.data;
            setCachedPods(data.items || []);
            setTotalPods(data.totalCount || 0);
        } catch (err) {
            setError("Failed to fetch pods: " + err.message);
            setCachedPods([]);
        } finally {
            setLoading(false);
        }
    }, [searchText, filters]);

    useEffect(() => {
        fetchPods();
        fetchAllNamespaces().then(setAllNamespaces);
    }, [fetchPods]);

    useEffect(() => {
        const startIndex = (pagination.page - 1) * pagination.rowsPerPage;
        const endIndex = startIndex + pagination.rowsPerPage;
        setPods(cachedPods.slice(startIndex, endIndex));
    }, [cachedPods, pagination]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchPods();
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        fetchPods();
    }, [fetchPods]);

    const fetchData = async () => {
        try {
            const response = await fetch("/api/pods");
            if (response.ok) {
                const data = await response.json();
                setPods(data);
            }
        } catch (error) {
            console.error("Error fetching pods:", error);
        }
    };

    const handleCreatePod = async (newPod) => {
        try {
            const response = await fetch("/api/pods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPod),
            });

            if (!response.ok) {
                let errorMsg = "Unknown error";
                try {
                    const errData = await response.json();
                    errorMsg = errData.error || response.statusText;
                } catch {}
                alert("Error creating pod: " + errorMsg);
                return;
            }

            alert("Pod created successfully!");
            await fetchData(); // Now fetchData is defined in the same scope
        } catch (err) {
            alert("Network error: " + err.message);
        }
    };

    const handlePodClick = useCallback(async (pod) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/pod/${pod.metadata.namespace}/${pod.metadata.name}/yaml`,
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

            setSelectedPodName(pod.metadata.name);
            setSelectedPodYaml(formattedYaml);
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch pod YAML:", err);
            setError("Failed to fetch pod YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);

    const handleFilterChange = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const handlePaginationChange = useCallback((newPage, newRowsPerPage) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage || prev.page,
            rowsPerPage: newRowsPerPage || prev.rowsPerPage,
        }));
    }, []);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    useEffect(() => {
        const handlePodUpdate = (obj) => {
            if (obj.type === "pod") {
                const podData = obj.data;

                setCachedPods((prevPods) => {
                    const pods = prevPods.filter(
                        (pod) => pod.metadata.name !== podData.metadata.name,
                    );
                    if (obj.phase === "DELETED") {
                        return pods;
                    } else {
                        return [...pods, podData];
                    }
                });
            } else if (obj.type === "namespace") {
                const namespace = obj.data;

                setAllNamespaces((prevNamespaces) => {
                    if (obj.phase === "DELETED") {
                        return prevNamespaces.filter((ns) => ns !== namespace);
                    } else if (!prevNamespaces.includes(namespace)) {
                        return [...prevNamespaces, namespace];
                    }
                    return prevNamespaces;
                });
            }
        };

        onUpdateEvent(handlePodUpdate);
    }, []);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <TitleComponent text="Volcano Pods Status" />
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={handleRefresh}
                    fetchData={fetchPods}
                    isRefreshing={false} // Update if needed
                    placeholder="Search Pods..."
                    refreshLabel="Refresh Pods"
                    createlabel="Create Pod"
                    dialogTitle="Create a Pod"
                    dialogResourceNameLabel="Pod Name"
                    dialogResourceType="Pod"
                    onCreateClick={handleCreatePod}
                />
            </Box>
            <PodsTable
                pods={pods}
                filters={filters}
                allNamespaces={allNamespaces}
                sortDirection={sortDirection}
                onSortDirectionToggle={toggleSortDirection}
                onFilterChange={handleFilterChange}
                onPodClick={handlePodClick}
            />
            <PodsPagination
                totalPods={totalPods}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
            />
            <PodDetailsDialog
                open={openDialog}
                podName={selectedPodName}
                podYaml={selectedPodYaml}
                onClose={handleCloseDialog}
            />
        </Box>
    );
};

export default Pods;
