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
    Tooltip,
} from "@mui/material";
import {
    FilterAlt,
    ViewColumn,
    Refresh,
    Settings,
    FilterList,
} from "@mui/icons-material";
import TableHeader from "./TableHeader";
import PodRow from "./PodRow";

const COLUMNS = {
    name: { label: "Name", required: true },
    namespace: { label: "Namespace", required: false },
    queue: { label: "Queue", required: false },
    creationTime: { label: "Creation Time", required: false },
    status: { label: "Status", required: false },
    phase: { label: "Phase", required: false },
    resources: { label: "Resources", required: false },
    node: { label: "Node", required: false },
    actions: { label: "Actions", required: true },
};

const POD_FILTER_OPTIONS = {
    status: ["All", "Running", "Pending", "Failed", "Succeeded", "Unknown"],
    namespace: ["All"], // Will be populated from props
    queue: ["All"], // Will be populated from props
    phase: ["All", "Running", "Pending", "Failed", "Succeeded"],
    node: ["All"], // Will be populated from props
};

const PodsTable = ({
    pods,
    allNamespaces,
    allQueues,
    allNodes,
    sortDirection,
    onSortDirectionToggle,
    onFilterChange,
    onPodClick,
    onPodDelete,
    onPodRefresh,
    onPodEdit,
    onBulkAction,
    isLoading,
    error,
}) => {
    const theme = useTheme();
    const [filterMenuAnchor, setFilterMenuAnchor] = React.useState({
        status: null,
        namespace: null,
        queue: null,
        phase: null,
        node: null,
    });

    const [activeFilters, setActiveFilters] = React.useState({
        status: "All",
        namespace: "All",
        queue: "All",
        phase: "All",
        node: "All",
    });

    const [selectedPods, setSelectedPods] = React.useState([]);
    const [visibleColumns, setVisibleColumns] = React.useState(
        Object.keys(COLUMNS).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}),
    );

    // Queue visibility state
    const [visibleQueues, setVisibleQueues] = React.useState(
        allQueues.reduce(
            (acc, queue) => {
                acc[queue] = true;
                return acc;
            },
            { All: true },
        ),
    );

    const [columnMenuAnchor, setColumnMenuAnchor] = React.useState(null);
    const [queueMenuAnchor, setQueueMenuAnchor] = React.useState(null);
    const [bulkActionAnchor, setBulkActionAnchor] = React.useState(null);

    const handleColumnVisibilityChange = (columnKey) => {
        if (COLUMNS[columnKey].required) return;
        setVisibleColumns((prev) => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    const handleQueueVisibilityChange = (queue) => {
        if (queue === "All") {
            // If "All" is clicked, toggle all queues
            const newValue = !visibleQueues["All"];
            setVisibleQueues(
                Object.keys(visibleQueues).reduce((acc, key) => {
                    acc[key] = newValue;
                    return acc;
                }, {}),
            );
        } else {
            setVisibleQueues((prev) => ({
                ...prev,
                [queue]: !prev[queue],
                All: false, // Uncheck "All" when individual queue is toggled
            }));
        }
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
                : prev.filter((p) => p.metadata.name !== pod.metadata.name),
        );
    };

    const handleSelectAllPods = (event) => {
        setSelectedPods(event.target.checked ? filteredPods : []);
    };

    const getFilterOptions = (filterType) => {
        switch (filterType) {
            case "status":
                return POD_FILTER_OPTIONS.status;
            case "namespace":
                return ["All", ...allNamespaces];
            case "queue":
                return ["All", ...allQueues].filter(
                    (queue) => visibleQueues[queue],
                );
            case "phase":
                return POD_FILTER_OPTIONS.phase;
            case "node":
                return ["All", ...allNodes];
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
                const queueMatch =
                    (activeFilters.queue === "All" ||
                        pod.spec?.queue === activeFilters.queue) &&
                    visibleQueues[pod.spec?.queue || "All"];
                const phaseMatch =
                    activeFilters.phase === "All" ||
                    pod.status?.phase === activeFilters.phase;
                const nodeMatch =
                    activeFilters.node === "All" ||
                    pod.spec?.nodeName === activeFilters.node;

                return (
                    statusMatch &&
                    namespaceMatch &&
                    queueMatch &&
                    phaseMatch &&
                    nodeMatch
                );
            }),
        [pods, activeFilters, visibleQueues],
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
                    {Object.keys(activeFilters).map((filterType) => (
                        <Button
                            key={filterType}
                            variant={
                                activeFilters[filterType] !== "All"
                                    ? "contained"
                                    : "outlined"
                            }
                            size="small"
                            onClick={(e) =>
                                handleFilterButtonClick(e, filterType)
                            }
                            startIcon={<FilterAlt />}
                            sx={{
                                textTransform: "capitalize",
                                borderRadius: "8px",
                                backgroundColor:
                                    activeFilters[filterType] !== "All"
                                        ? alpha(theme.palette.primary.main, 0.1)
                                        : "transparent",
                                "&:hover": {
                                    backgroundColor:
                                        activeFilters[filterType] !== "All"
                                            ? alpha(
                                                  theme.palette.primary.main,
                                                  0.2,
                                              )
                                            : alpha(
                                                  theme.palette.primary.main,
                                                  0.05,
                                              ),
                                },
                            }}
                        >
                            {filterType}
                        </Button>
                    ))}
                </Box>

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
                        onClick={(e) => setQueueMenuAnchor(e.currentTarget)}
                        startIcon={<FilterList />}
                    >
                        Configure Queues
                    </Button>
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
                open={Boolean(queueMenuAnchor)}
                anchorEl={queueMenuAnchor}
                onClose={() => setQueueMenuAnchor(null)}
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
                    Visible Queues
                </Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={visibleQueues["All"]}
                            onChange={() => handleQueueVisibilityChange("All")}
                        />
                    }
                    label="All Queues"
                    sx={{ display: "block", mb: 1 }}
                />
                {allQueues.map((queue) => (
                    <FormControlLabel
                        key={queue}
                        control={
                            <Checkbox
                                checked={visibleQueues[queue]}
                                onChange={() =>
                                    handleQueueVisibilityChange(queue)
                                }
                            />
                        }
                        label={queue}
                        sx={{ display: "block", mb: 1 }}
                    />
                ))}
            </Popover>

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
                {Object.entries(COLUMNS).map(([key, { label, required }]) => (
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
                        allQueues={allQueues}
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
                                        p.metadata.name === pod.metadata.name,
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
                queue: PropTypes.string,
                nodeName: PropTypes.string,
            }),
        }),
    ).isRequired,
    allNamespaces: PropTypes.arrayOf(PropTypes.string).isRequired,
    allQueues: PropTypes.arrayOf(PropTypes.string).isRequired,
    allNodes: PropTypes.arrayOf(PropTypes.string).isRequired,
    sortDirection: PropTypes.string.isRequired,
    onSortDirectionToggle: PropTypes.func.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    onPodClick: PropTypes.func.isRequired,
    onPodDelete: PropTypes.func,
    onPodRefresh: PropTypes.func,
    onPodEdit: PropTypes.func,
    onBulkAction: PropTypes.func,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
};

export default PodsTable;
