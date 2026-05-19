import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import axios from "axios";
import SearchBar from "../Searchbar";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces } from "../utils";
import PodsTable from "./PodsTable/PodsTable";
import PodsPagination from "./PodsPagination";
import PodDetailsDialog from "./PodDetailsDialog";
import { translations } from "../../config/translations";

const Pods = () => {
    const [pods, setPods] = useState([]);
    const [cachedPods, setCachedPods] = useState([]);
    const [, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allNamespaces, setAllNamespaces] = useState([]);
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "default",
    });
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
    });
    const [selectedPodYaml, setSelectedPodYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [searchText, setSearchText] = useState("");
    const hasFetchedRef = useRef(false);
    const isFetchingRef = useRef(false);
    const theme = useTheme();
    const [selectedPodName, setSelectedPodName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalPods, setTotalPods] = useState(0);
    const [sortDirection, setSortDirection] = useState("");

    const getPodsErrorMessage = (code) =>
        translations.zh.fetchError
            .replace("{resource}", translations.zh.pods)
            .replace("{code}", code);

    const getPodsApiErrorMessage = (code) =>
        translations.zh.apiError
            .replace("{resource}", translations.zh.pods)
            .replace("{code}", code);

    const fetchPods = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
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
            const errorCode = err.response?.status || err.message || "Unknown";
            console.error(translations.zh.errorFetch, err);
            setError(errorCode);
        } finally {
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [searchText, filters]);

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        fetchPods();
        fetchAllNamespaces().then(setAllNamespaces).catch((err) => {
            console.error(translations.zh.errorFetch, err);
            setAllNamespaces([]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({
            ...prev,
            [filterType]: event.currentTarget,
        }));
    }, []);

    const handleFilterClose = useCallback((filterType, value) => {
        if (filterType) {
            setFilters((prev) => ({ ...prev, [filterType]: value }));
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        }
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

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
                } catch {
                    // ignore error
                }
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
            const errorCode = err.response?.status || err.message || "Unknown";
            setError(getPodsApiErrorMessage(errorCode));
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

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    获取 Pods 失败: 请求失败, 状态码 {String(error)}
                </Typography>
            )}
            <TitleComponent text={translations.zh.volcanoPodsStatus} />
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={handleRefresh}
                    fetchData={fetchPods}
                    isRefreshing={false} // Update if needed
                    placeholder={translations.zh.searchPods}
                    refreshLabel={translations.zh.refreshListings}
                    createlabel={translations.zh.createPod}
                    dialogTitle={translations.zh.createPod}
                    dialogResourceNameLabel={translations.zh.podName}
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
                anchorEl={anchorEl}
                handleFilterClick={handleFilterClick}
                handleFilterClose={handleFilterClose}
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
