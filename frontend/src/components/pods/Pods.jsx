import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import axios from "axios";
import yaml from "js-yaml";
import SearchBar from "../Searchbar";
import TitleComponent from "../Titlecomponent";
import { fetchAllNamespaces } from "../utils";
import PodsTable from "./PodsTable/PodsTable";
import PodsPagination from "./PodsPagination";
import PodDetailsDialog from "./PodDetailsDialog";
import PodEditDialog from "./PodEditDialog";
import PodTableDeleteDialog from "./PodTableDeleteDialog";

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
    const [selectedPodYaml, setSelectedPodYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedPodName, setSelectedPodName] = useState("");
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [podToEdit, setPodToEdit] = useState(null);
    const [editError, setEditError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [podToDelete, setPodToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalPods, setTotalPods] = useState(0);
    const [sortDirection, setSortDirection] = useState("");

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

    const formatYamlForDisplay = useCallback((yamlText) => {
        return yamlText
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
    }, []);

    const fetchPodYaml = useCallback(async (pod) => {
        const response = await axios.get(
            `/api/pod/${pod.metadata.namespace}/${pod.metadata.name}/yaml`,
            { responseType: "text" },
        );

        return response.data;
    }, []);

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
            await fetchPods();
        } catch (err) {
            alert("Network error: " + err.message);
        }
    };

    const handlePodClick = useCallback(async (pod) => {
        try {
            setLoading(true);
            const yamlText = await fetchPodYaml(pod);
            setSelectedPodName(pod.metadata.name);
            setSelectedPodYaml(formatYamlForDisplay(yamlText));
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch pod YAML:", err);
            setError("Failed to fetch pod YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [fetchPodYaml, formatYamlForDisplay]);

    const handleOpenEditDialog = useCallback(async (pod) => {
        try {
            setLoading(true);
            setEditError(null);
            const yamlText = await fetchPodYaml(pod);
            setPodToEdit(yaml.load(yamlText));
            setOpenEditDialog(true);
        } catch (err) {
            console.error("Failed to fetch pod YAML for edit:", err);
            setError("Failed to fetch pod YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [fetchPodYaml]);

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setOpenEditDialog(false);
        setPodToEdit(null);
        setEditError(null);
        setIsSaving(false);
    }, []);

    const handleSavePod = useCallback(async (updatedPod) => {
        const originalNamespace = podToEdit?.metadata?.namespace;
        const originalName = podToEdit?.metadata?.name;

        if (!updatedPod?.metadata?.namespace || !updatedPod?.metadata?.name) {
            setEditError("Pod metadata.name and metadata.namespace are required.");
            return false;
        }

        if (!originalNamespace || !originalName) {
            setEditError("Unable to determine the original pod identity.");
            return false;
        }

        setIsSaving(true);
        setEditError(null);

        try {
            const response = await fetch(
                `/api/pod/${encodeURIComponent(originalNamespace)}/${encodeURIComponent(originalName)}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(updatedPod),
                },
            );

            const contentType = response.headers.get("content-type");
            const text = await response.text();
            let data = {};

            try {
                data =
                    contentType && contentType.includes("application/json") && text
                        ? JSON.parse(text)
                        : { message: text };
            } catch {
                data = { message: text };
            }

            if (!response.ok) {
                const detailParts = [];
                const displayName = data?.details?.name || updatedPod.metadata.name;

                if (data.message) {
                    detailParts.push(data.message);
                }

                if (data.reason) {
                    detailParts.push(`Reason: ${data.reason}`);
                }

                if (data.details) {
                    if (typeof data.details === "object") {
                        const fieldParts = [];
                        if (data.details.name) fieldParts.push(`name=${data.details.name}`);
                        if (data.details.kind) fieldParts.push(`kind=${data.details.kind}`);
                        if (fieldParts.length > 0) {
                            detailParts.push(`Details: ${fieldParts.join(", ")}`);
                        }
                    } else {
                        detailParts.push(`Details: ${data.details}`);
                    }
                }

                setEditError(
                    detailParts.length > 0
                        ? `Pod "${originalNamespace}/${displayName}" could not be updated. ${detailParts.join(" • ")}`
                        : text ||
                            `Pod "${originalNamespace}/${displayName}" could not be updated.`,
                );
                return false;
            }

            const updatedFromServer = data.data || updatedPod;
            setCachedPods((currentPods) =>
                currentPods.map((pod) =>
                    pod.metadata.namespace === originalNamespace &&
                    pod.metadata.name === originalName
                        ? updatedFromServer
                        : pod,
                ),
            );
            setPods((currentPods) =>
                currentPods.map((pod) =>
                    pod.metadata.namespace === originalNamespace &&
                    pod.metadata.name === originalName
                        ? updatedFromServer
                        : pod,
                ),
            );

            return updatedFromServer;
        } catch (err) {
            setEditError(err.message || "An unexpected error occurred.");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [podToEdit]);

    const handleOpenDeleteDialog = useCallback((pod) => {
        setPodToDelete(pod);
        setDeleteError(null);
        setOpenDeleteDialog(true);
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        setOpenDeleteDialog(false);
        setPodToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    }, []);

    const handleDeletePod = useCallback(async () => {
        if (!podToDelete) {
            return;
        }

        setIsDeleting(true);

        try {
            const { namespace, name } = podToDelete.metadata;
            const response = await fetch(
                `/api/pod/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );

            const contentType = response.headers.get("content-type");
            const text = await response.text();
            let data = {};

            try {
                data =
                    contentType && contentType.includes("application/json") && text
                        ? JSON.parse(text)
                        : { message: text };
            } catch {
                data = { message: text };
            }

            if (!response.ok) {
                setDeleteError(
                    data.message ||
                        data.details ||
                        text ||
                        `Pod "${namespace}/${name}" could not be deleted.`,
                );
                return;
            }

            setCachedPods((currentPods) =>
                currentPods.filter(
                    (pod) =>
                        !(
                            pod.metadata.namespace === namespace &&
                            pod.metadata.name === name
                        ),
                ),
            );
            setTotalPods((currentTotal) => Math.max(currentTotal - 1, 0));
            setPagination((currentPagination) => {
                const nextTotal = Math.max(totalPods - 1, 0);
                const maxPage = Math.max(
                    1,
                    Math.ceil(nextTotal / currentPagination.rowsPerPage),
                );

                return {
                    ...currentPagination,
                    page: Math.min(currentPagination.page, maxPage),
                };
            });
            handleCloseDeleteDialog();
        } catch (err) {
            setDeleteError(err.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    }, [handleCloseDeleteDialog, podToDelete, totalPods]);

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
                onOpenEditDialog={handleOpenEditDialog}
                onOpenDeleteDialog={handleOpenDeleteDialog}
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
            <PodEditDialog
                open={openEditDialog}
                pod={podToEdit}
                onClose={handleCloseEditDialog}
                onSave={handleSavePod}
                error={editError}
                isSaving={isSaving}
            />
            <PodTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDeletePod}
                podToDelete={
                    podToDelete
                        ? `${podToDelete.metadata.namespace}/${podToDelete.metadata.name}`
                        : ""
                }
                error={deleteError}
                isDeleting={isDeleting}
            />
        </Box>
    );
};

export default Pods;
