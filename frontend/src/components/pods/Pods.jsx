import React, { useCallback, useEffect, useState, useContext } from "react";
import { Box, Button, Typography, useTheme, Paper } from "@mui/material";
import axios from "axios";
import SearchBar from "../Searchbar";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces } from "../utils";
import PodsTable from "./PodsTable/PodsTable";
import PodsPagination from "./PodsPagination";
import PodDetailsDialog from "./PodDetailsDialog";
import { ErrorContext } from "../Layout";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import RefreshIcon from "@mui/icons-material/Refresh";
import { isBackendAvailable, resetBackendStatus } from "../../App";

let podsSearchDebounceTimeout = null;

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
                    <WorkspacesIcon sx={{ fontSize: 60, color: "#9E9E9E" }} />
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const { setError: setGlobalError, clearError: clearGlobalError } = useContext(ErrorContext);

    const fetchPods = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && !isBackendAvailable()) {
            console.log("Skipping fetch - backend unavailable");
            return;
        }

        setLoading(true);
        setError(null);
        setIsRefreshing(true);

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
            
            setError(null);
            clearGlobalError(); 
            
        } catch (err) {
            const errorMessage = "Failed to fetch pods: " + err.message;
            setError(errorMessage);
            setCachedPods([]);
            
            if (err.response && err.response.status === 500) {
                setGlobalError("The Volcano API is currently unavailable. We're working to restore service.", "error");
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [searchText, filters, setGlobalError, clearGlobalError]);

    useEffect(() => {
        fetchPods();
        
        const fetchData = async () => {
            try {
                if (isBackendAvailable()) {
                    const namespaces = await fetchAllNamespaces();
                    setAllNamespaces(namespaces);
                }
            } catch (err) {
                console.error("Failed to fetch namespaces:", err);
            }
        };
        
        fetchData();
    }, []);

    useEffect(() => {
        const startIndex = (pagination.page - 1) * pagination.rowsPerPage;
        const endIndex = startIndex + pagination.rowsPerPage;
        setPods(cachedPods.slice(startIndex, endIndex));
    }, [cachedPods, pagination]);

    const handleSearch = (event) => {
        const newSearchText = event.target.value;
        setSearchText(newSearchText);
        setPagination((prev) => ({ ...prev, page: 1 }));
        
        // Clear any existing timeout
        if (podsSearchDebounceTimeout) {
            clearTimeout(podsSearchDebounceTimeout);
        }
        
        podsSearchDebounceTimeout = setTimeout(() => {
            fetchPods(); 
        }, 300); 
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        
        if (podsSearchDebounceTimeout) {
            clearTimeout(podsSearchDebounceTimeout);
        }
        
        fetchPods();
    };

    const handleRefresh = useCallback(() => {
        resetBackendStatus();
        setPagination((prev) => ({ ...prev, page: 1 }));
        setSearchText("");
        fetchPods(true); 
    }, [fetchPods]);

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

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            <TitleComponent text="Volcano Pods Status" />
            
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={handleRefresh}
                    fetchData={fetchPods}
                    isRefreshing={isRefreshing}
                    placeholder="Search Pods..."
                    refreshLabel="Refresh Pods"
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
            ) : loading && pods.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body1" color="textSecondary">
                        Loading pod data...
                    </Typography>
                </Box>
            ) : pods.length === 0 ? (
                <EmptyState 
                    message="No pods found matching your current filters."
                    onRetry={handleRefresh}
                />
            ) : (
                <>
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
                </>
            )}
        </Box>
    );
};

export default Pods;