import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useTheme, InputAdornment, Tooltip, CircularProgress, DialogContentText, Tabs, Tab } from "@mui/material";
import { ArrowDownward, ArrowUpward, Clear, Error, FilterList, Refresh, Search, UnfoldMore, Delete, Edit, MoreVert, Code } from "@mui/icons-material";
import axios from "axios";
import {parseCPU, parseMemoryToMi} from "./utils";
import { Editor } from "@monaco-editor/react";
import yaml from 'js-yaml';
import { Cancel, Save } from "@mui/icons-material";

const Queues = () => {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: "All",
    });
    const [selectedQueueYaml, setSelectedQueueYaml] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState({
        status: null,
    });
    const [searchText, setSearchText] = useState("");
    const theme = useTheme();
    const [selectedQueueName, setSelectedQueueName] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        rowsPerPage: 10,
    });
    const [totalQueues, setTotalQueues] = useState(0);
    const [sortDirection, setSortDirection] = useState("desc");
    // New state for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    // New state for action menu
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [selectedQueue, setSelectedQueue] = useState(null);

    // New state for edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentEditMode, setCurrentEditMode] = useState('yaml'); // 'yaml' or 'json'
    const [editedContent, setEditedContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    const [sortConfig, setSortConfig] = useState({
        field: null,
        direction: "asc",
    });

    const fetchQueues = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                "/api/queues",
                {
                    params: {
                        page: pagination.page,
                        limit: pagination.rowsPerPage,
                        search: searchText,
                        state: filters.status,
                    },
                }
            );

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = response.data;
            setQueues(data.items || []);
            setTotalQueues(data.totalCount || 0); // 更新 totalQueues
        } catch (err) {
            setError("Failed to fetch queues: " + err.message);
            setQueues([]);
        } finally {
            setLoading(false);
        }
    }, [pagination, searchText, filters]);

    useEffect(() => {
        fetchQueues();
    }, [fetchQueues]);

    const handleSearch = (event) => {
        setSearchText(event.target.value);
        setPagination((prev) => ({...prev, page: 1}));
    };

    const handleClearSearch = () => {
        setSearchText("");
        setPagination((prev) => ({...prev, page: 1}));
        fetchQueues();
    };

    const handleRefresh = useCallback(() => {
        setPagination((prev) => ({...prev, page: 1}));
        setSearchText("");
        fetchQueues();
    }, [fetchQueues]);

    // Function to handle queue deletion
    const handleDeleteQueue = useCallback(async () => {
        if (!queueToDelete) return;
        
        console.log(`Attempting to delete queue: ${queueToDelete}`);
        setDeleteLoading(true);
        
        try {
            const response = await axios.delete(`/api/queue/${queueToDelete}`);
            
            
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            fetchQueues();
            setDeleteDialogOpen(false);
            setQueueToDelete(null);
        } catch (err) {
            setError(`Failed to delete queue ${queueToDelete}: ${err.message}`);
        } finally {
            setDeleteLoading(false);
        }
    }, [queueToDelete, fetchQueues]);

    // Function to open delete confirmation dialog
    const openDeleteDialog = useCallback((queueName) => {
        setQueueToDelete(queueName);
        setDeleteDialogOpen(true);
        setActionMenuAnchorEl(null); // Close the action menu
    }, []);

    // Function to close delete confirmation dialog
    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false);
        setQueueToDelete(null);
    }, []);

    // Function to convert YAML to JSON
    const yamlToJson = useCallback((yamlContent) => {
        try {
            const jsonObject = yaml.load(yamlContent);
            return JSON.stringify(jsonObject, null, 2);
        } catch (err) {
            console.error("Failed to convert YAML to JSON:", err);
            setEditError("Failed to convert YAML to JSON: " + err.message);
            return "";
        }
    }, []);

    // Function to convert JSON to YAML
    const jsonToYaml = useCallback((jsonContent) => {
        try {
            const jsonObject = JSON.parse(jsonContent);
            return yaml.dump(jsonObject);
        } catch (err) {
            console.error("Failed to convert JSON to YAML:", err);
            setEditError("Failed to convert JSON to YAML: " + err.message);
            return "";
        }
    }, []);

    // Function to handle edit action
    const handleEditQueue = useCallback(async (queueName) => {
        setActionMenuAnchorEl(null); // Close the action menu
        setEditError(null);
        setUpdateLoading(false);
        
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/queue/${queueName}/yaml`,
                {responseType: "text"}
            );
            
            const yamlContent = response.data;
            setSelectedQueueName(queueName);
            setOriginalContent(yamlContent);
            setEditedContent(yamlContent);
            setCurrentEditMode('yaml');
            setEditDialogOpen(true);
        } catch (err) {
            console.error("Failed to fetch queue YAML for editing:", err);
            setError("Failed to fetch queue YAML for editing: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Function to handle tab change in the edit dialog
    const handleTabChange = useCallback((event, newValue) => {
        if (newValue === currentEditMode) return;
        
        try {
            if (newValue === 'json') {
                // Convert current YAML to JSON
                const jsonContent = yamlToJson(editedContent);
                setEditedContent(jsonContent);
            } else {
                // Convert current JSON to YAML
                const yamlContent = jsonToYaml(editedContent);
                setEditedContent(yamlContent);
            }
            setCurrentEditMode(newValue);
            setEditError(null);
        } catch (err) {
            console.error(`Failed to convert between formats:`, err);
            setEditError(`Failed to convert between formats: ${err.message}`);
        }
    }, [currentEditMode, editedContent, yamlToJson, jsonToYaml]);

    // Function to handle editor content change
    const handleEditorChange = useCallback((value) => {
        setEditedContent(value);
    }, []);

    // Function to validate edited content
    const validateContent = useCallback(() => {
        try {
            if (currentEditMode === 'yaml') {
                yaml.load(editedContent);
            } else {
                JSON.parse(editedContent);
            }
            return true;
        } catch (err) {
            setEditError(`Invalid ${currentEditMode.toUpperCase()}: ${err.message}`);
            return false;
        }
    }, [currentEditMode, editedContent]);

    // Function to handle update action
    const handleUpdateQueue = useCallback(async () => {
        if (!validateContent()) return;
        
        setUpdateLoading(true);
        setEditError(null);
        
        try {
            // Prepare the content for update (always send YAML to the backend)
            let contentToUpdate = editedContent;
            if (currentEditMode === 'json') {
                contentToUpdate = jsonToYaml(editedContent);
            }
            
            const response = await axios.put(
                `/api/queue/${selectedQueueName}`,
                contentToUpdate,
                {
                    headers: {
                        'Content-Type': 'text/yaml'
                    }
                }
            );
            
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log(`Queue ${selectedQueueName} updated successfully`);
            fetchQueues();
            setEditDialogOpen(false);
        } catch (err) {
            console.error(`Error updating queue:`, err);
            setEditError(`Failed to update queue: ${err.message}`);
        } finally {
            setUpdateLoading(false);
        }
    }, [selectedQueueName, editedContent, currentEditMode, validateContent, jsonToYaml, fetchQueues]);

    // Function to close edit dialog
    const closeEditDialog = useCallback(() => {
        setEditDialogOpen(false);
        setEditedContent('');
        setOriginalContent('');
        setEditError(null);
    }, []);

    // New function to open action menu
    const handleActionMenuOpen = useCallback((e, queue) => {
        e.stopPropagation(); // Prevent row click event
        setSelectedQueue(queue);
        setActionMenuAnchorEl(e.currentTarget);
    }, []);

    // New function to close action menu
    const handleActionMenuClose = useCallback(() => {
        setActionMenuAnchorEl(null);
    }, []);

    const handleQueueClick = useCallback(async (queue) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/queue/${queue.metadata.name}/yaml`,
                {responseType: "text"}
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

            setSelectedQueueName(queue.metadata.name);
            setSelectedQueueYaml(formattedYaml);
            setOpenDialog(true);
        } catch (err) {
            console.error("Failed to fetch queue YAML:", err);
            setError("Failed to fetch queue YAML: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCloseDialog = useCallback(() => {
        setOpenDialog(false);
    }, []);

    const handleChangePage = useCallback((event, newPage) => {
        setPagination((prev) => ({...prev, page: newPage}));
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setPagination((prev) => ({...prev, rowsPerPage: parseInt(event.target.value, 10), page: 1}));
    }, []);

    const getStateColor = useCallback((status) => {
        switch (status) {
            case "Open":
                return theme.palette.success.main;
            case "Closing":
                return theme.palette.warning.main;
            case "Closed":
                return theme.palette.info.main;
            default:
                return theme.palette.grey[500];
        }
    }, [theme]);

    const handleFilterClick = useCallback((filterType, event) => {
        setAnchorEl((prev) => ({...prev, [filterType]: event.currentTarget}));
    }, []);

    const handleFilterClose = useCallback((filterType, value) => {
        setFilters((prev) => ({...prev, [filterType]: value}));
        setAnchorEl((prev) => ({...prev, [filterType]: null}));
        setPagination((prev) => ({...prev, page: 1}));
    }, [fetchQueues]);

    const uniqueStates = useMemo(() => {
        return ["All", ...new Set(queues.map((queue) => queue.status?.state).filter(Boolean))];
    }, [queues]);

    const sortQueues = useCallback((queues, config) => {
        if (!config.field) return queues;

        return [...queues].sort((a, b) => {
            let aValue, bValue;

            switch (config.field) {
                case "cpu":
                    aValue = parseCPU(a.status?.allocated?.cpu || "0");
                    bValue = parseCPU(b.status?.allocated?.cpu || "0");
                    break;
                case "memory":
                    aValue = parseMemoryToMi(a.status?.allocated?.memory || 0);
                    bValue = parseMemoryToMi(b.status?.allocated?.memory || 0);
                    break;
                case "pods":
                    aValue = Number(a.status?.allocated?.pods) || 0;
                    bValue = Number(b.status?.allocated?.pods) || 0;
                    break;
                case "creationTime":
                    aValue = new Date(a.metadata.creationTimestamp).getTime();
                    bValue = new Date(b.metadata.creationTimestamp).getTime();
                    break;
                default:
                    aValue = a[config.field];
                    bValue = b[config.field];
            }

            if (config.direction === "asc") {
                return aValue > bValue ? 1 : -1;
            }
            return aValue < bValue ? 1 : -1;
        });
    }, []);

    const sortedQueues = useMemo(() => {
        return sortQueues(queues, sortConfig);
    }, [queues, sortConfig, sortQueues]);

    const handleSort = (field) => {
        setSortConfig((prevConfig) => ({
            field,
            direction:
                prevConfig.field === field && prevConfig.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

    const allocatedFields = useMemo(() => {
        const fields = new Set();
        queues.forEach((queue) => {
            if (queue.status?.allocated) {
                Object.keys(queue.status.allocated).forEach((key) => {
                    fields.add(key);
                });
            }
        });
        return Array.from(fields).sort();
    }, [queues]);

    // Get kubectl command preview
    const kubectlCommand = useMemo(() => {
        if (!selectedQueueName) return '';
        return `kubectl apply -f ${selectedQueueName}.yaml`;
    }, [selectedQueueName]);

return (
        <Box sx={{bgcolor: "background.default", minHeight: "100vh", p: 3}}>
            {error && (
                <Box sx={{mt: 2, color: theme.palette.error.main}}>
                    <Typography variant="body1">{error}</Typography>
                </Box>
            )}
            <Typography variant="h4" gutterBottom align="left">
                Volcano Queues Status
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2
                }}
            >
               <Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
    <TextField
        placeholder="Search queues"
        variant="outlined"
        size="small"
        value={searchText}
        sx={{ width: 200 }}  
        onChange={handleSearch}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <IconButton
                        size="small"
                        onClick={() => fetchQueues()}
                        sx={{padding: "4px"}}
                        
                    >
                        <Search/>
                    </IconButton>
                </InputAdornment>
            ),
            endAdornment: searchText && (
                <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    sx={{padding: "4px"}}
                >
                    <Clear/>
                </IconButton>
            ),
        }}
    />
</Box>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Refresh/>}
                    onClick={handleRefresh}
                >
                    Refresh Queue Status
                </Button>
            </Box>
            <TableContainer
                component={Paper}
                sx={{maxHeight: "calc(100vh - 200px)", overflow: "auto"}}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{backgroundColor: "background.paper", padding: "8px 16px", minWidth: 120}}>
                                <Typography variant="h6">Name</Typography>
                            </TableCell>

                            {/* get allocated field dynamically */}
                            {allocatedFields.map((field) => (
                                <TableCell key={field}>
                                    <Box sx={{display: "flex", alignItems: "center"}}>
                                        <Typography variant="h6">{`Allocated ${field}`}</Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleSort(field)}
                                        >
                                            {sortConfig.field === field ? (
                                                sortConfig.direction === "asc" ? (
                                                    <ArrowUpward/>
                                                ) : (
                                                    <ArrowDownward/>
                                                )
                                            ) : (
                                                <UnfoldMore/>
                                            )}
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            ))}

                            <TableCell sx={{backgroundColor: "background.paper", padding: "8px 16px", minWidth: 120}}>
                                <Typography variant="h6">Creation Time</Typography>
                                <Button
                                    size="small"
                                    onClick={() => handleSort("creationTime")}
                                    startIcon={sortConfig.field === "creationTime" ? (
                                        sortConfig.direction === "asc" ? (
                                            <ArrowUpward/>
                                        ) : (
                                            <ArrowDownward/>
                                        )
                                    ) : (
                                        <UnfoldMore/>
                                    )}
                                    sx={{textTransform: "none", padding: 0, minWidth: "auto"}}
                                >
                                    Sort
                                </Button>
                            </TableCell>
                            <TableCell sx={{backgroundColor: "background.paper", padding: "8px 16px", minWidth: 120}}>
                                <Typography variant="h6">State</Typography>
                                <Button
                                    size="small"
                                    startIcon={<FilterList/>}
                                    onClick={(e) => handleFilterClick("status", e)}
                                    sx={{textTransform: "none", padding: 0, minWidth: "auto"}}
                                >
                                    Filter: {filters.status}
                                </Button>
                                <Menu
                                    anchorEl={anchorEl.status}
                                    open={Boolean(anchorEl.status)}
                                    onClose={() => setAnchorEl((prev) => ({...prev, status: null}))}
                                >
                                    {uniqueStates.map((status) => (
                                        <MenuItem key={status} onClick={() => handleFilterClose("status", status)}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </TableCell>
                            {/* Action column for dropdown menu */}
                            <TableCell sx={{backgroundColor: "background.paper", padding: "8px 16px", minWidth: 80}}>
                                <Typography variant="h6">Actions</Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedQueues
                            .map((queue) => (
                                <TableRow
                                    hover
                                    key={queue.metadata.name}
                                    onClick={() => handleQueueClick(queue)}
                                    sx={{
                                        "&:nth-of-type(odd)": {bgcolor: "action.hover"},
                                        "&:hover": {
                                            bgcolor: "action.hover",
                                            color: "primary.main",
                                            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                                        },
                                        cursor: "pointer",
                                    }}
                                >
                                    <TableCell>{queue.metadata.name}</TableCell>
                                    {allocatedFields.map((field) => (
                                        <TableCell key={field}>
                                            {queue.status?.allocated?.[field] || "0"}
                                        </TableCell>
                                    ))}
                                    <TableCell>{new Date(queue.metadata.creationTimestamp).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={queue.status ? queue.status.state : "Unknown"}
                                            sx={{
                                                bgcolor: getStateColor(
                                                    queue.status ? queue.status.state : "Unknown"
                                                ),
                                                color: "common.white",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Queue Actions">
                                            <IconButton
                                                onClick={(e) => handleActionMenuOpen(e, queue)}
                                                sx={{
                                                    "&:hover": {
                                                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                                                    },
                                                }}
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Select
                    value={pagination.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    size="small"
                >
                    <MenuItem value={5}>5 per page</MenuItem>
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={20}>20 per page</MenuItem>
                </Select>
                <Box
                    sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 2}}>
                    <Typography variant="body2" sx={{mr: 2}}>
                        Total Queues: {totalQueues}
                    </Typography>
                    <Pagination
                        count={Math.ceil(totalQueues / pagination.rowsPerPage)}
                        page={pagination.page}
                        onChange={handleChangePage}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Box>

            {/* Action Menu */}
            <Menu
                anchorEl={actionMenuAnchorEl}
                open={Boolean(actionMenuAnchorEl)}
                onClose={handleActionMenuClose}
            >
                <MenuItem 
                    onClick={() => handleEditQueue(selectedQueue?.metadata.name)}
                    sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 1,
                        minWidth: "120px"
                        
                    }}
                >
                    <Edit fontSize="small" color="primary" />
                    <Typography variant="body2">Edit</Typography>
                </MenuItem>
                <MenuItem 
                    onClick={() => openDeleteDialog(selectedQueue?.metadata.name)}
                    sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 1,
                    }}
                >
                    <Delete fontSize="small" color="error" />
                    <Typography variant="body2">Delete</Typography>
                </MenuItem>
            </Menu>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        width: "80%",
                        maxWidth: "800px",
                        maxHeight: "90vh",
                        m: 2,
                        bgcolor: "background.paper",
                    },
                }}
            >
                <DialogTitle>Queue YAML - {selectedQueueName}</DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            mt: 2,
                            mb: 2,
                            fontFamily: "monospace",
                            fontSize: "1.2rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 150px)",
                            bgcolor: "grey.50",
                            p: 2,
                            borderRadius: 1,
                            "& .yaml-key": {
                                fontWeight: 700,
                                color: "#000",
                            },
                        }}
                    >
                        <pre dangerouslySetInnerHTML={{__html: selectedQueueYaml}}/>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 2,
                            width: "100%",
                            px: 2,
                            pb: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCloseDialog}
                            sx={{
                                minWidth: "100px",
                                "&:hover": {
                                    bgcolor: "primary.dark",
                                },
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={closeDeleteDialog}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Queue Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete the queue "{queueToDelete}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={closeDeleteDialog} 
                        color="primary"
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteQueue}
                        color="error"
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {deleteLoading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Queue Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={closeEditDialog}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        width: "80%",
                        maxWidth: "900px",
                        maxHeight: "90vh",
                        m: 2,
                        bgcolor: "background.paper",
                    },
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Edit Queue - {selectedQueueName}</Typography>
                        <Tabs 
                            value={currentEditMode} 
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab 
                                value="yaml" 
                                label="YAML" 
                                icon={<Code />} 
                                iconPosition="start"
                            />
                            <Tab 
                                value="json" 
                                label="JSON" 
                                icon={<Code />} 
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {editError && (
                        <Box sx={{ mt: 1, mb: 2, p: 1, bgcolor: theme.palette.error.light, borderRadius: 1 }}>
                            <Typography color="error" variant="body2">{editError}</Typography>
                        </Box>
                    )}
                    <Box sx={{ height: 'calc(60vh - 100px)', mt: 2 }}>
                        <Editor
                            height="100%"
                            language={currentEditMode === 'yaml' ? 'yaml' : 'json'}
                            value={editedContent}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                                fontFamily: "'Fira Code', 'Consolas', monospace",
                                fontSize: 14,
                                tabSize: 2,
                            }}
                        />
                    </Box>
                    
                </DialogContent>
                <DialogActions>
                    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                        <Button
                            onClick={closeEditDialog}
                            variant="outlined"
                            color="primary"
                            startIcon={<Cancel />}
                            disabled={updateLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateQueue}
                            variant="contained"
                            color="primary"
                            startIcon={updateLoading ? <CircularProgress size={20} /> : <Save />}
                            disabled={updateLoading || !!editError}
                        >
                            {updateLoading ? "Updating..." : "Update Queue"}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Queues;