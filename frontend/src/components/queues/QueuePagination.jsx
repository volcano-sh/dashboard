import React, { useState } from "react";
import { Box, Typography, Pagination, Select, MenuItem, Button, Tooltip } from "@mui/material";
import { Download, List, Grid as GridIcon } from "lucide-react";

const QueuePagination = ({
    pagination,
    totalQueues,
    handleChangeRowsPerPage,
    handleChangePage,
    onExportQueues, // New prop for export functionality
    onToggleViewMode // New prop for toggling view mode
}) => {
    const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
    
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        onToggleViewMode(mode);
    };

    return (
        <Box
            sx={{
                mt: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <Box display="flex" alignItems="center">
                <Select
                    value={pagination.rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    size="small"
                >
                    <MenuItem value={5}>5 per page</MenuItem>
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={20}>20 per page</MenuItem>
                </Select>
                
                {/* View mode toggle buttons */}
                <Box ml={2} display="flex" alignItems="center">
                    <Tooltip title="Table View">
                        <Button 
                            variant={viewMode === "table" ? "contained" : "outlined"}
                            size="small"
                            sx={{ minWidth: '40px', p: 1, mr: 1 }}
                            onClick={() => handleViewModeChange("table")}
                        >
                            <List size={16} />
                        </Button>
                    </Tooltip>
                    <Tooltip title="Grid View">
                        <Button 
                            variant={viewMode === "grid" ? "contained" : "outlined"}
                            size="small"
                            sx={{ minWidth: '40px', p: 1 }}
                            onClick={() => handleViewModeChange("grid")}
                        >
                            <GridIcon size={16} />
                        </Button>
                    </Tooltip>
                </Box>
                
                {/* Export button */}
                <Tooltip title="Export Queues">
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download size={16} />}
                        onClick={onExportQueues}
                        sx={{ ml: 2 }}
                    >
                        Export
                    </Button>
                </Tooltip>
            </Box>
            
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                    mb: 2,
                }}
            >
                <Typography variant="body2" sx={{ mr: 2 }}>
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
    );
};

export default QueuePagination;