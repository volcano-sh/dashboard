import React from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
} from "@mui/material";
import PodRow from "./PodRow";
import TableHeader from "../../Reusable-components/TableHeader";
import DeleteDialog from "../../Reusable-components/DeleteDialog";

const PodsTable = ({
    pods,
    filters,
    allNamespaces,
    sortDirection,
    onSortDirectionToggle,
    onFilterChange,
    onPodClick,
    onPodUpdate,
}) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState({
        status: null,
        namespace: null,
    });

    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [podToDelete, setPodToDelete] = React.useState(null);
    const [deleteError, setDeleteError] = React.useState(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [podsState, setPodsState] = React.useState(pods);

    React.useEffect(() => {
        setPodsState(pods);
    }, [pods]);

    const handleFilterClick = React.useCallback((filterType, event) => {
        setAnchorEl((prev) => ({ ...prev, [filterType]: event.currentTarget }));
    }, []);

    const handleFilterClose = React.useCallback(
        (filterType, value) => {
            onFilterChange(filterType, value);
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        },
        [onFilterChange],
    );

    const handleFilterSelect = React.useCallback(
        (filterType, value) => {
            onFilterChange(filterType, value);
            setAnchorEl((prev) => ({ ...prev, [filterType]: null }));
        },
        [onFilterChange],
    );

    const filteredPods = React.useMemo(
        () =>
            podsState.filter(
                (pod) =>
                    (filters.status === "All" ||
                        (pod.status && pod.status.phase === filters.status)) &&
                    (filters.namespace === "All" ||
                        pod.metadata.namespace === filters.namespace),
            ),
        [podsState, filters],
    );

    const sortedPods = React.useMemo(
        () =>
            [...filteredPods].sort((a, b) => {
                const compareResult =
                    new Date(b.metadata.creationTimestamp) -
                    new Date(a.metadata.creationTimestamp);
                return sortDirection === "desc"
                    ? compareResult
                    : -compareResult;
            }),
        [filteredPods, sortDirection],
    );

    const getStatusColor = React.useCallback(
        (status) => {
            switch (status) {
                case "Failed":
                    return theme.palette.error.main;
                case "Pending":
                    return theme.palette.warning.main;
                case "Running":
                    return theme.palette.success.main;
                case "Succeeded":
                    return theme.palette.info.main;
                default:
                    return theme.palette.grey[500];
            }
        },
        [theme],
    );

    // --- Dialog handlers ---
    const handleOpenDeleteDialog = (pod) => {
        setPodToDelete(pod);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setPodToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    };

    const handleDelete = async () => {
        if (!podToDelete) return;
        setIsDeleting(true);
        try {
            const { namespace, name } = podToDelete.metadata;

            const response = await fetch(
                `/api/pods/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );

            let data = {};
            const contentType = response.headers.get("content-type");
            const text = await response.text();

            let isJsonResponse = false;
            try {
                if (
                    (contentType && contentType.includes("application/json")) ||
                    (text && !text.trim().startsWith("<"))
                ) {
                    data = text ? JSON.parse(text) : {};
                    isJsonResponse = true;
                }
            } catch (parseError) {
                console.warn("Failed to parse response as JSON:", parseError);
            }

            if (!response.ok) {
                let customMessage = `Pod "${namespace}/${name}" could not be deleted.`;
                let errorType = "UnknownError";

                if (
                    isJsonResponse &&
                    typeof data === "object" &&
                    (data.error || data.details)
                ) {
                    customMessage = data.error || data.details;
                    if (customMessage.toLowerCase().includes("denied")) {
                        errorType = "ValidationError";
                    } else {
                        errorType = "KubernetesError";
                    }
                }

                const fullMessage = `Cannot delete pod "${namespace}/${name}". Error message: ${customMessage}`;
                const error = new Error(fullMessage);
                error.type = errorType;
                error.status = response.status;
                throw error;
            }

            // Success
            setPodsState((prev) =>
                prev.filter(
                    (p) =>
                        !(
                            p.metadata.namespace === namespace &&
                            p.metadata.name === name
                        ),
                ),
            );
            handleCloseDeleteDialog();
        } catch (error) {
            console.error("Error deleting pod:", error);
            setDeleteError(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    // COLUMN config for the universal TableHeader
    const columns = [
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace", filterable: true },
        { key: "creationTime", label: "Creation Time", sortable: true },
        { key: "status", label: "Status", filterable: true },
        { key: "age", label: "Age" },
    ];

    return (
        <>
            <TableContainer
                component={Paper}
                sx={{
                    maxHeight: "calc(100vh - 200px)",
                    overflow: "auto",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Table stickyHeader>
                    <TableHeader
                        columns={columns}
                        filters={filters}
                        anchorEl={anchorEl}
                        onSort={(key) => {
                            if (key === "creationTime") onSortDirectionToggle();
                        }}
                        sortConfig={{
                            field: "creationTime",
                            direction: sortDirection,
                        }}
                        onFilterClick={handleFilterClick}
                        onFilterClose={handleFilterClose}
                        onFilterSelect={handleFilterSelect}
                        filterOptions={{
                            namespace: allNamespaces,
                            status: [
                                "All",
                                "Running",
                                "Pending",
                                "Succeeded",
                                "Failed",
                            ],
                        }}
                        actionsLabel="Actions"
                    />
                    <TableBody>
                        {sortedPods.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    align="center"
                                >
                                    No pods found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedPods.map((pod) => (
                                <PodRow
                                    key={`${pod.metadata.namespace}-${pod.metadata.name}`}
                                    pod={pod}
                                    getStatusColor={getStatusColor}
                                    onPodClick={onPodClick}
                                    onPodUpdate={onPodUpdate}
                                    handleOpenDeleteDialog={
                                        handleOpenDeleteDialog
                                    }
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <DeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDelete}
                podToDelete={podToDelete}
                error={deleteError}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default PodsTable;
