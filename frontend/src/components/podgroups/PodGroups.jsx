import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import axios from "axios";
import { escape } from "lodash";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces } from "../utils";
import PodGroupsTable from "./PodGroupsTable/PodGroupsTable";
import JobPagination from "../jobs/JobPagination"; // Reuse pagination
import SearchBar from "../Searchbar";
import PodGroupDialog from "./PodGroupDialog"; // Need to create this

const PodGroups = () => {
    const [podGroups, setPodGroups] = useState([]);
    const [cachedPodGroups, setCachedPodGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allNamespaces, setAllNamespaces] = useState([]);
    const [filters, setFilters] = useState({
        status: "All",
        namespace: "All",
    });
    const [selectedYaml, setSelectedYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
        namespace: null,
    });
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedName, setSelectedName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalItems, setTotalItems] = useState(0);
    const [sortDirection, setSortDirection] = useState("desc");

    const fetchPodGroups = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/podgroups`, {
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
            setCachedPodGroups(data.items || []);
            setTotalItems(data.totalCount || 0);
        } catch (err) {
            setError("Failed to fetch podgroups: " + err.message);
            setCachedPodGroups([]);
        } finally {
            setLoading(false);
        }
    }, [searchText, filters]);

    useEffect(() => {
        fetchPodGroups();
        fetchAllNamespaces().then(setAllNamespaces);
    }, [fetchPodGroups]);

    useEffect(() => {
        const startIndex = (pagination.page - 1) * pagination.rowsPerPage;
        const endIndex = startIndex + pagination.rowsPerPage;
        setPodGroups(cachedPodGroups.slice(startIndex, endIndex));
    }, [cachedPodGroups, pagination]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchPodGroups();
    };

    const handleClick = useCallback(async (pg) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/podgroups/${pg.metadata.namespace}/${pg.metadata.name}/yaml`,
                { responseType: "text" },
            );

            const formattedYaml = response.data
                .split("\n")
                .map((line) => {
                    const keyMatch = line.match(/^(\s*)([^:\s]+):/);
                    if (keyMatch) {
                        const [, indent, key] = keyMatch;
                        const value = line.slice(keyMatch[0].length);
                        return `${indent}<span class="yaml-key">${escape(key)}</span>:${escape(value)}`;
                    }
                    return escape(line);
                })
                .join("\n");

            setSelectedName(pg.metadata.name);
            setSelectedYaml(formattedYaml);
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch YAML:", err);
            setError("Failed to fetch YAML: " + err.message);
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

    const uniqueStatuses = useMemo(() => {
        return [
            "All",
            ...new Set(
                cachedPodGroups.map((pg) => pg.status?.phase).filter(Boolean),
            ),
        ];
    }, [cachedPodGroups]);

    const sortedPodGroups = useMemo(() => {
        return [...podGroups].sort((a, b) => {
            const compareResult =
                new Date(b.metadata.creationTimestamp) -
                new Date(a.metadata.creationTimestamp);
            return sortDirection === "desc" ? compareResult : -compareResult;
        });
    }, [podGroups, sortDirection]);

    const toggleSortDirection = useCallback(() => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    // For now, no creation dialog
    const handleCreate = () => {
        alert("Create PodGroup not implemented yet");
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <TitleComponent text="Volcano PodGroups" />
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={fetchPodGroups}
                    fetchData={fetchPodGroups}
                    isRefreshing={loading}
                    placeholder="Search PodGroups..."
                    refreshLabel="Refresh Listings"
                    createlabel="Create PodGroup"
                    dialogTitle="Create PodGroup"
                    dialogResourceNameLabel="Name"
                    dialogResourceType="PodGroup"
                    onCreateClick={handleCreate}
                />
            </Box>
            <PodGroupsTable
                podGroups={sortedPodGroups}
                handlePodGroupClick={handleClick}
                filters={filters}
                uniqueStatuses={uniqueStatuses}
                allNamespaces={allNamespaces}
                anchorEl={anchorEl}
                handleFilterClick={handleFilterClick}
                handleFilterClose={handleFilterClose}
                sortDirection={sortDirection}
                toggleSortDirection={toggleSortDirection}
            />
            <JobPagination
                pagination={pagination}
                totalJobs={totalItems} // Prop name in JobPagination is totalJobs
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
            <PodGroupDialog
                open={openDialog}
                handleClose={handleCloseDialog}
                selectedName={selectedName}
                selectedYaml={selectedYaml}
            />
        </Box>
    );
};

export default PodGroups;

