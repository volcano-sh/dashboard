import React, { useMemo, useState } from "react";
import {
    TableContainer,
    Table,
    TableBody,
    Paper,
    TableRow,
    TableCell,
    useTheme,
    alpha,
    Box,
    Typography,
    Button,
} from "@mui/material";
import { UnfoldLess, UnfoldMore as UnfoldMoreIcon } from "@mui/icons-material";
import QueueTableHeader from "../QueueTable/QueueTableHeader";
import QueueTreeNode from "./QueueTreeNode";
import QueueTableDeleteDialog from "../QueueTable/QueueTableDeleteDialog";
import { API_BASE } from "../../../lib/client/dashboard-api";
import { getStoredToken } from "../../../lib/client/auth-token";
import {
    buildQueueTree,
    filterTreeWithAncestors,
    sortTreeNodes,
} from "../utils/queueTreeBuilder";

const QueueTreeView = ({
    queues,
    allocatedFields,
    handleQueueClick,
    handleSort,
    sortConfig,
    filters,
    handleFilterClick,
    anchorEl,
    uniqueStates,
    handleFilterClose,
    setAnchorEl,
    onQueueUpdate,
    searchText,
    sortQueues,
}) => {
    const theme = useTheme();
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Build tree structure with search filtering
    const treeData = useMemo(() => {
        // First, sort the flat queues array if sorting is enabled
        let processedQueues = queues;
        if (sortConfig.field && sortQueues) {
            processedQueues = sortQueues(queues, sortConfig);
        }

        // Build the tree
        let tree = buildQueueTree(processedQueues);

        // Apply search filter if search text exists
        if (searchText && searchText.trim()) {
            const searchLower = searchText.toLowerCase();
            const { filteredTree, expandedNodes: autoExpandedNodes } =
                filterTreeWithAncestors(tree, (node) => {
                    return (
                        node.metadata.name
                            .toLowerCase()
                            .includes(searchLower) ||
                        node.status?.state?.toLowerCase().includes(searchLower)
                    );
                });

            // Auto-expand nodes that have matching descendants
            setExpandedNodes((prev) => {
                const newSet = new Set(prev);
                autoExpandedNodes.forEach((nodeName) => newSet.add(nodeName));
                return newSet;
            });

            tree = filteredTree;
        }

        // If sorting is enabled, sort each level of the tree
        if (sortConfig.field && sortQueues) {
            const compareFn = (a, b) => {
                // Use the same sorting logic as in Queues.jsx
                const sorted = sortQueues([a, b], sortConfig);
                return sorted[0] === a ? -1 : 1;
            };
            tree = sortTreeNodes(tree, compareFn);
        }

        return tree;
    }, [queues, searchText, sortConfig, sortQueues]);

    const handleToggleExpand = (nodeName) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeName)) {
                newSet.delete(nodeName);
            } else {
                newSet.add(nodeName);
            }
            return newSet;
        });
    };

    const handleExpandAll = () => {
        const allNodeNames = new Set();
        const collectNodeNames = (nodes) => {
            nodes.forEach((node) => {
                if (node.children && node.children.length > 0) {
                    allNodeNames.add(node.metadata.name);
                    collectNodeNames(node.children);
                }
            });
        };
        collectNodeNames(treeData);
        setExpandedNodes(allNodeNames);
    };

    const handleCollapseAll = () => {
        setExpandedNodes(new Set());
    };

    const handleOpenDeleteDialog = (queueName) => {
        setQueueToDelete(queueName);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQueueToDelete(null);
        setDeleteError(null);
        setIsDeleting(false);
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const token = getStoredToken();

            const response = await fetch(
                `${API_BASE}/queues/${encodeURIComponent(queueToDelete)}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                },
            );

            let data: any = {};
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
                let customMessage = `queues.scheduling.volcano.sh "${queueToDelete}" is forbidden.`;
                let errorType = "UnknownError";

                if (
                    isJsonResponse &&
                    typeof data === "object" &&
                    (data.message || data.details)
                ) {
                    customMessage = data.message || data.details;
                    if (customMessage.toLowerCase().includes("denied")) {
                        errorType = "ValidationError";
                    } else {
                        errorType = "KubernetesError";
                    }
                }

                const fullMessage = `Cannot delete "${queueToDelete}". Error message: ${customMessage}`;
                const error: any = new Error(fullMessage);
                error.type = errorType;
                error.status = response.status;
                throw error;
            }

            if (onQueueUpdate) {
                onQueueUpdate();
            }
            handleCloseDeleteDialog();
        } catch (error) {
            console.error("Error deleting queue:", error);
            setDeleteError(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    {sortConfig.field && (
                        <em>Sorting applies per-level in tree view</em>
                    )}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        size="small"
                        startIcon={<UnfoldMoreIcon fontSize="small" />}
                        onClick={handleExpandAll}
                        sx={{
                            textTransform: "none",
                            borderRadius: "8px",
                            fontWeight: 500,
                        }}
                    >
                        Expand All
                    </Button>
                    <Button
                        size="small"
                        startIcon={<UnfoldLess fontSize="small" />}
                        onClick={handleCollapseAll}
                        sx={{
                            textTransform: "none",
                            borderRadius: "8px",
                            fontWeight: 500,
                        }}
                    >
                        Collapse All
                    </Button>
                </Box>
            </Box>

            <TableContainer
                component={Paper}
                sx={{
                    maxHeight: "calc(100vh - 280px)",
                    overflow: "auto",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                    background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
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
                    <QueueTableHeader
                        allocatedFields={allocatedFields}
                        handleSort={handleSort}
                        sortConfig={sortConfig}
                        filters={filters}
                        handleFilterClick={handleFilterClick}
                        anchorEl={anchorEl}
                        uniqueStates={uniqueStates}
                        handleFilterClose={handleFilterClose}
                        setAnchorEl={setAnchorEl}
                    />
                    <TableBody>
                        {treeData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={allocatedFields.length + 4}
                                    align="center"
                                >
                                    {searchText ? (
                                        <Box sx={{ py: 4 }}>
                                            <Typography
                                                variant="body1"
                                                color="text.secondary"
                                            >
                                                No queues match your search.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        "No queues found."
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            treeData.map((node) => (
                                <QueueTreeNode
                                    key={node.metadata.name}
                                    node={node}
                                    level={0}
                                    allocatedFields={allocatedFields}
                                    handleQueueClick={handleQueueClick}
                                    handleOpenDeleteDialog={
                                        handleOpenDeleteDialog
                                    }
                                    expandedNodes={expandedNodes}
                                    onToggleExpand={handleToggleExpand}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <QueueTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleDelete}
                queueToDelete={queueToDelete}
                error={deleteError}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default QueueTreeView;
