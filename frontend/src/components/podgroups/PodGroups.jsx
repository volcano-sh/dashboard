import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import axios from "axios";
import { escape } from "lodash";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces } from "../utils";
import PodGroupsTable from "./PodGroupsTable/PodGroupsTable";
import JobPagination from "../jobs/JobPagination"; // Reuse pagination
import SearchBar from "../Searchbar";
import PodGroupDialog from "./PodGroupDialog"; // Need to create this
import { translations } from "../../config/translations";

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
    const hasFetchedRef = useRef(false);
    const isFetchingRef = useRef(false);

    const getPodGroupsErrorMessage = (code) =>
        translations.zh.fetchError
            .replace("{resource}", translations.zh.podGroups)
            .replace("{code}", code);

    const getPodGroupsApiErrorMessage = (code) =>
        translations.zh.apiError
            .replace("{resource}", translations.zh.podGroups)
            .replace("{code}", code);

    const fetchPodGroups = useCallback(
        async ({
            search = searchText,
            namespace = filters.namespace,
            status = filters.status,
        } = {}) => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`/api/podgroups`, {
                    params: {
                        search,
                        namespace,
                        status,
                    },
                });

                if (response.status !== 200) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = response.data;
                setCachedPodGroups(data.items || []);
                setTotalItems(data.totalCount || 0);
            } catch (err) {
                const errorCode = err.response?.status || err.message || "Unknown";
                setError(getPodGroupsErrorMessage(errorCode));
                setCachedPodGroups([]);
            } finally {
                isFetchingRef.current = false;
                setLoading(false);
            }
        },
        [searchText, filters],
    );

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        fetchPodGroups();
        fetchAllNamespaces()
            .then(setAllNamespaces)
                .catch((err) => {
                    console.error(translations.zh.errorFetch, err);
                    setAllNamespaces([]);
                });
    }, []);

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
            console.error(translations.zh.errorFetch, err);
            const errorCode = err.response?.status || err.message || "Unknown";
            setError(getPodGroupsApiErrorMessage(errorCode));
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
        if (filterType) {
            setFilters((prev) => ({ ...prev, [filterType]: value }));
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        }
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
    const handleCreatePodGroup = useCallback(async (resourceData) => {
        console.log("Create PodGroup data:", resourceData);
        alert("Create PodGroup not implemented yet");
    }, []);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            {error && (
                <Box sx={{ mt: 2, color: theme.palette.error.main }}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <TitleComponent text={translations.zh.volcanoPodGroups} />
            <Box>
                <SearchBar
                    searchText={searchText}
                    handleSearch={handleSearch}
                    handleClearSearch={handleClearSearch}
                    handleRefresh={fetchPodGroups}
                    fetchData={fetchPodGroups}
                    isRefreshing={loading}
                    placeholder={translations.zh.searchPodGroups}
                    refreshLabel={translations.zh.refreshListings}
                    createlabel={translations.zh.createPodGroup}
                    dialogTitle={translations.zh.createPodGroupTitle}
                    dialogResourceNameLabel={translations.zh.podGroupName}
                    dialogResourceType="PodGroup"
                    onCreateClick={handleCreatePodGroup}
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
                totalLabel={translations.zh.totalCountPodGroups}
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
