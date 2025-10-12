import React from "react";
import PropTypes from "prop-types";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    useTheme,
    alpha,
    Box,
    Button,
    Menu,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Popover,
    Typography,
} from "@mui/material";
import { ViewColumn, Refresh, Settings } from "@mui/icons-material";
import TableHeader from "./TableHeader";
import PodRow from "./PodRow";

const COLUMNS = {
    select: { label: "", required: true },
    name: { label: "Name", required: true },
    namespace: { label: "Namespace", required: false },
    queue: { label: "Queue", required: false },
    creationTime: { label: "Creation Time", required: false },
    age: { label: "Age", required: false },
    status: { label: "Status", required: false },
    phase: { label: "Phase", required: false },
    resources: { label: "Resources", required: false },
    node: { label: "Node", required: false },
    actions: { label: "Actions", required: true },
};

const POD_FILTER_OPTIONS = {
    status: ["All", "Running", "Pending", "Failed", "Succeeded", "Unknown"],
    namespace: ["All"], // Will be populated from props
    phase: ["All", "Running", "Pending", "Failed", "Succeeded"],
};

const PodsTable = ({
    pods,
    allNamespaces,
    sortDirection,
    onSortDirectionToggle,
    onFilterChange,
    onPodClick,
    onPodDelete,
    onPodRefresh,
    onPodEdit,
    onBulkAction,
    error,
}) => {
    const theme = useTheme();
    const [filterMenuAnchor, setFilterMenuAnchor] = React.useState({
        status: null,
        namespace: null,
        phase: null,
    });

    const [activeFilters, setActiveFilters] = React.useState({
        status: "All",
        namespace: "All",
        phase: "All",
    });

    const [selectedPods, setSelectedPods] = React.useState([]);
    const [visibleColumns, setVisibleColumns] = React.useState(
        Object.keys(COLUMNS).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}),
    );

    const [columnMenuAnchor, setColumnMenuAnchor] = React.useState(null);
    const [bulkActionAnchor, setBulkActionAnchor] = React.useState(null);

    const handleColumnVisibilityChange = (columnKey) => {
        if (COLUMNS[columnKey].required || columnKey === "select") return;
        setVisibleColumns((prev) => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    const handleFilterButtonClick = (event, filterType) => {
        setFilterMenuAnchor((prev) => ({
            ...prev,
            [filterType]: event.currentTarget,
        }));
    };

    const handleFilterMenuClose = (filterType) => {
        setFilterMenuAnchor((prev) => ({
            ...prev,
            [filterType]: null,
        }));
    };

    const handleFilterSelect = (filterType, value) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterType]: value,
        }));
        handleFilterMenuClose(filterType);
        onFilterChange(filterType, value);
    };

    const handleBulkActionClick = (action) => {
        if (selectedPods.length === 0) return;
        onBulkAction?.(action, selectedPods);
        setBulkActionAnchor(null);
        setSelectedPods([]);
    };

    const handlePodSelect = (pod, isSelected) => {
        setSelectedPods((prev) =>
            isSelected
                ? [...prev, pod]
                : prev.filter(
                      (p) =>
                          !(
                              p.metadata.name === pod.metadata.name &&
                              p.metadata.namespace === pod.metadata.namespace
                          ),
                  ),
        );
    };

    const handleSelectAllPods = (event) => {
        if (event.target.checked) {
            // Select all filtered pods that aren't already selected
            const podsToAdd = filteredPods.filter(
                (pod) =>
                    !selectedPods.some(
                        (selectedPod) =>
                            selectedPod.metadata.name === pod.metadata.name &&
                            selectedPod.metadata.namespace ===
                                pod.metadata.namespace,
                    ),
            );
            setSelectedPods([...selectedPods, ...podsToAdd]);
        } else {
            // Deselect only the filtered pods
            setSelectedPods(
                selectedPods.filter(
                    (selectedPod) =>
                        !filteredPods.some(
                            (pod) =>
                                pod.metadata.name ===
                                    selectedPod.metadata.name &&
                                pod.metadata.namespace ===
                                    selectedPod.metadata.namespace,
                        ),
                ),
            );
        }
    };

    const getFilterOptions = (filterType) => {
        switch (filterType) {
            case "status":
                return POD_FILTER_OPTIONS.status;
            case "namespace":
                return ["All", ...allNamespaces];
            case "phase":
                return POD_FILTER_OPTIONS.phase;
            default:
                return ["All"];
        }
    };

    const filteredPods = React.useMemo(
        () =>
            pods.filter((pod) => {
                const statusMatch =
                    activeFilters.status === "All" ||
                    pod.status?.phase === activeFilters.status;
                const namespaceMatch =
                    activeFilters.namespace === "All" ||
                    pod.metadata?.namespace === activeFilters.namespace;
                const phaseMatch =
                    activeFilters.phase === "All" ||
                    pod.status?.phase === activeFilters.phase;

                return statusMatch && namespaceMatch && phaseMatch;
            }),
        [pods, activeFilters],
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

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="error" variant="h6">
                    {error}
                </Typography>
                <Button
                    startIcon={<Refresh />}
                    onClick={() => onFilterChange("refresh", true)}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <React.Fragment>
            <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Box sx={{ display: "flex", gap: 1 }}>
                    {selectedPods.length > 0 && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={(e) =>
                                setBulkActionAnchor(e.currentTarget)
                            }
                            startIcon={<Settings />}
                        >
                            Bulk Actions ({selectedPods.length})
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                        startIcon={<ViewColumn />}
                    >
                        Configure Columns
                    </Button>
                </Box>
            </Box>

            <Menu
                anchorEl={bulkActionAnchor}
                open={Boolean(bulkActionAnchor)}
                onClose={() => setBulkActionAnchor(null)}
            >
                <MenuItem onClick={() => handleBulkActionClick("delete")}>
                    Delete Selected
                </MenuItem>
                <MenuItem onClick={() => handleBulkActionClick("refresh")}>
                    Refresh Selected
                </MenuItem>
            </Menu>

            <Popover
                open={Boolean(columnMenuAnchor)}
                anchorEl={columnMenuAnchor}
                onClose={() => setColumnMenuAnchor(null)}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                PaperProps={{
                    sx: {
                        p: 2,
                        minWidth: 200,
                    },
                }}
            >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Visible Columns
                </Typography>
                {Object.entries(COLUMNS)
                    .filter(([key]) => key !== "select")
                    .map(([key, { label, required }]) => (
                        <FormControlLabel
                            key={key}
                            control={
                                <Checkbox
                                    checked={visibleColumns[key]}
                                    onChange={() =>
                                        handleColumnVisibilityChange(key)
                                    }
                                    disabled={required}
                                />
                            }
                            label={label}
                            sx={{ display: "block", mb: 1 }}
                        />
                    ))}
            </Popover>

            <TableContainer
                component={Paper}
                sx={{
                    maxHeight: "calc(100vh - 200px)",
                    overflow: "auto",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    background: `linear-gradient(to bottom, ${alpha(
                        theme.palette.background.paper,
                        0.9,
                    )}, ${theme.palette.background.paper})`,
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    "&::-webkit-scrollbar": {
                        width: "10px",
                        height: "10px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: "5px",
                        "&:hover": {
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.3,
                            ),
                        },
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05,
                        ),
                        borderRadius: "5px",
                    },
                }}
            >
                <Table stickyHeader>
                    <TableHeader
                        filters={activeFilters}
                        filterMenuAnchor={filterMenuAnchor}
                        handleFilterButtonClick={handleFilterButtonClick}
                        handleFilterSelect={handleFilterSelect}
                        handleFilterMenuClose={handleFilterMenuClose}
                        getFilterOptions={getFilterOptions}
                        allNamespaces={allNamespaces}
                        sortDirection={sortDirection}
                        onSortDirectionToggle={onSortDirectionToggle}
                        visibleColumns={visibleColumns}
                        columns={COLUMNS}
                        selectedPods={selectedPods}
                        onSelectAll={handleSelectAllPods}
                        totalPods={filteredPods.length}
                    />
                    <TableBody>
                        {sortedPods.map((pod) => (
                            <PodRow
                                key={`${pod.metadata.namespace}-${pod.metadata.name}`}
                                pod={pod}
                                getStatusColor={getStatusColor}
                                onPodClick={onPodClick}
                                onDelete={onPodDelete}
                                onRefresh={onPodRefresh}
                                onEdit={onPodEdit}
                                visibleColumns={visibleColumns}
                                columns={COLUMNS}
                                isSelected={selectedPods.some(
                                    (p) =>
                                        p.metadata.name === pod.metadata.name &&
                                        p.metadata.namespace ===
                                            pod.metadata.namespace,
                                )}
                                onSelect={handlePodSelect}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    );
};

PodsTable.propTypes = {
    pods: PropTypes.arrayOf(
        PropTypes.shape({
            metadata: PropTypes.shape({
                name: PropTypes.string.isRequired,
                namespace: PropTypes.string.isRequired,
                creationTimestamp: PropTypes.string.isRequired,
            }).isRequired,
            status: PropTypes.shape({
                phase: PropTypes.string,
            }),
            spec: PropTypes.shape({
                nodeName: PropTypes.string,
            }),
        }),
    ).isRequired,
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    sortDirection: PropTypes.string.isRequired,
    onSortDirectionToggle: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    onPodClick: PropTypes.func.isRequired,
    onPodDelete: PropTypes.func,
    onPodRefresh: PropTypes.func,
    onPodEdit: PropTypes.func,
    onBulkAction: PropTypes.func,
    error: PropTypes.string,
};

export default PodsTable;
