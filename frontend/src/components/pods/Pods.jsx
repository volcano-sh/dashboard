import React, { useCallback, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import SearchBar from "../Searchbar";
import TitleComponent from "../Titlecomponent";
import PodsTable from "./PodsTable";
import PodsPagination from "./PodsPagination";
import PodDetailsDialog from "./PodDetailsDialog";
import { trpc } from "../../utils/trpc";

const Pods = () => {
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
    const [sortDirection, setSortDirection] = useState("");

    const podsQuery = trpc.podRouter.getPods.useQuery(
        {
            search: searchText,
            namespace: filters.namespace,
            status: filters.status,
            page: pagination.page,
            pageSize: pagination.rowsPerPage,
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching pods:", err);
                setError(`Pods API error: ${err.message}`);
            },
        },
    );

    const namespacesQuery = trpc.namespaceRouter.getNamespaces.useQuery(
        {},
        {
            onError: (err) => {
                console.error("Error fetching namespaces:", err);
                setError(`Namespaces API error: ${err.message}`);
            },
        },
    );

    const podYamlQuery = trpc.podRouter.getPodYaml.useQuery(
        {
            namespace: filters.namespace,
            name: selectedPodName,
        },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching pod YAML:", err);
                setError(`Pod YAML API error: ${err.message}`);
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
    };

    const handleRefresh = useCallback(() => {
        setError(null);
        podsQuery.refetch();
        namespacesQuery.refetch();
    }, [podsQuery, namespacesQuery]);

    const handleFilterChange = useCallback((filterType, value) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    const handlePaginationChange = useCallback((newPage, newRowsPerPage) => {
        setPagination((prev) => ({
            ...prev,
            page: newPage || prev.page,
            rowsPerPage: newRowsPerPage || prev.rowsPerPage,
        }));
    }, []);

    const handlePodClick = useCallback(
        async (pod) => {
            try {
                setSelectedPodName(pod.metadata.name);
                const response = await podYamlQuery.refetch();

                console.log(response);

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

                setSelectedPodYaml(formattedYaml);
                setOpenDialog(true);
            } catch (err) {
                console.error("Failed to fetch pod YAML:", err);
                setError("Failed to fetch pod YAML: " + err.message);
            }
        },
        [podYamlQuery],
    );

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);

    const isLoading = podsQuery.isLoading || namespacesQuery.isLoading;
    const isRefreshing = podsQuery.isRefetching || namespacesQuery.isRefetching;

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
                    fetchData={handleRefresh}
                    isRefreshing={isRefreshing}
                    placeholder="Search Pods..."
                    refreshLabel="Refresh Pods"
                />
            </Box>
            <PodsTable
                pods={podsQuery.data?.items || []}
                isLoading={isLoading}
                filters={filters}
                allNamespaces={allNamespaces}
                sortDirection={sortDirection}
                onSortDirectionToggle={toggleSortDirection}
                onFilterChange={handleFilterChange}
                onPodClick={handlePodClick}
            />
            <PodsPagination
                totalPods={podsQuery.data?.totalCount || 0}
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
