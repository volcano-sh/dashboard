// Fixed QueueTable.jsx with Working Expand/Collapse
import React, { useState } from "react";
import {
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    useTheme,
    alpha,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Typography,
    Chip,
    styled,
    Collapse,
} from "@mui/material";
import { ArrowUpward, ArrowDownward, FilterList, Clear, ExpandMore, ExpandLess } from "@mui/icons-material";
import QueueTableRow from "./QueueTableRow";
import QueueTableDeleteDialog from "./QueueTableDeleteDialog";

// Compact styled components
const CompactFilterContainer = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
    backdropFilter: 'blur(8px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '16px',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
}));

const CompactFormControl = styled(FormControl)(({ theme }) => ({
    minWidth: 120,
    '& .MuiOutlinedInput-root': {
        height: '36px',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
        '&.Mui-focused': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
        }
    },
    '& .MuiInputLabel-root': {
        fontSize: '13px',
        fontWeight: 500,
        transform: 'translate(12px, 9px) scale(1)',
        '&.MuiInputLabel-shrink': {
            transform: 'translate(12px, -6px) scale(0.85)',
        }
    },
    '& .MuiSelect-select': {
        padding: '8px 12px',
        fontSize: '14px',
    }
}));

const QueueTable = ({
    sortedQueues,
    allocatedFields,
    handleQueueClick,
    handleSort,
    sortConfig,
    filters,
    uniqueStates,
    onFilterChange,
    handleDelete,
}) => {
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [queueToDelete, setQueueToDelete] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleOpenDeleteDialog = (queueName) => {
        setQueueToDelete(queueName);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQueueToDelete(null);
    };

    const confirmDelete = () => {
        if (handleDelete && queueToDelete) {
            handleDelete(queueToDelete);
        }
        handleCloseDeleteDialog();
    };

    const activeFiltersCount = Object.values(filters).filter(value => value !== "All").length;

    const clearAllFilters = () => {
        onFilterChange('status', 'All');
    };

    // FIXED: Toggle function that actually works
    const toggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
    };

    return (
        <Box>
            {/* Compact Filters Section */}
            <CompactFilterContainer>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* Filter Icon and Label */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterList sx={{ color: 'primary.main', fontSize: 18 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Filters
                        </Typography>
                        {activeFiltersCount > 0 && (
                            <Chip 
                                label={activeFiltersCount} 
                                size="small" 
                                color="primary"
                                sx={{ height: 20, fontSize: '11px', fontWeight: 600 }}
                            />
                        )}
                    </Box>

                    {/* Main Filters - Always Visible */}
                    <CompactFormControl size="small">
                        <InputLabel>State</InputLabel>
                        <Select
                            value={filters.status}
                            label="State"
                            onChange={(e) => onFilterChange('status', e.target.value)}
                        >
                            {uniqueStates.map(state => (
                                <MenuItem key={state} value={state}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ 
                                            width: 6, 
                                            height: 6, 
                                            borderRadius: state === 'Open' ? '50%' : '2px', 
                                            backgroundColor: state === 'All' ? 'text.secondary' : 
                                                           state === 'Open' ? 'success.main' : 
                                                           state === 'Closed' ? 'error.main' : 'warning.main'
                                        }} />
                                        {state}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </CompactFormControl>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        {activeFiltersCount > 0 && (
                            <IconButton 
                                onClick={clearAllFilters}
                                size="small"
                                sx={{ 
                                    color: 'text.secondary',
                                    width: 32,
                                    height: 32,
                                    '&:hover': { 
                                        color: 'error.main',
                                        backgroundColor: alpha(theme.palette.error.main, 0.1)
                                    }
                                }}
                            >
                                <Clear fontSize="small" />
                            </IconButton>
                        )}
                        
                        {/* FIXED: Only show expand button if there are active filters */}
                        {activeFiltersCount > 0 && (
                            <IconButton 
                                onClick={toggleAdvanced}
                                size="small"
                                sx={{ 
                                    color: 'primary.main',
                                    width: 32,
                                    height: 32,
                                    '&:hover': { 
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                    }
                                }}
                            >
                                {showAdvanced ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {/* FIXED: Collapsible Active Filters Summary - Only controlled by showAdvanced */}
                <Collapse in={showAdvanced && activeFiltersCount > 0}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Active Filters:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {filters.status !== 'All' && (
                                <Chip 
                                    label={`State: ${filters.status}`} 
                                    size="small"
                                    onDelete={() => onFilterChange('status', 'All')}
                                    sx={{ height: 24, fontSize: '12px' }}
                                />
                            )}
                        </Box>
                    </Box>
                </Collapse>
            </CompactFilterContainer>

            {/* Table with adjusted height */}
            <TableContainer
                component={Paper}
                sx={{
                    maxHeight: "calc(100vh - 240px)",
                    overflow: "auto",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                    background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    "&::-webkit-scrollbar": {
                        width: "6px",
                        height: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                        borderRadius: "3px",
                        "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.5),
                        },
                    },
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow sx={{
                            '& .MuiTableCell-head': {
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                                backdropFilter: 'blur(8px)',
                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                                fontSize: '13px',
                                height: '48px'
                            }
                        }}>
                            <TableCell>Name</TableCell>
                            <TableCell 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleSort('cpu')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Allocated CPU
                                    {sortConfig.field === 'cpu' && (
                                        sortConfig.direction === 'asc' ? 
                                        <ArrowUpward fontSize="small" /> : 
                                        <ArrowDownward fontSize="small" />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleSort('memory')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Allocated Memory
                                    {sortConfig.field === 'memory' && (
                                        sortConfig.direction === 'asc' ? 
                                        <ArrowUpward fontSize="small" /> : 
                                        <ArrowDownward fontSize="small" />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleSort('pods')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Allocated Pods
                                    {sortConfig.field === 'pods' && (
                                        sortConfig.direction === 'asc' ? 
                                        <ArrowUpward fontSize="small" /> : 
                                        <ArrowDownward fontSize="small" />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleSort('creationTime')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Creation Time
                                    {sortConfig.field === 'creationTime' && (
                                        sortConfig.direction === 'asc' ? 
                                        <ArrowUpward fontSize="small" /> : 
                                        <ArrowDownward fontSize="small" />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>State</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedQueues.map((queue) => (
                            <QueueTableRow
                                key={queue.metadata.name}
                                queue={queue}
                                allocatedFields={allocatedFields}
                                handleQueueClick={handleQueueClick}
                                handleOpenDeleteDialog={handleOpenDeleteDialog}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <QueueTableDeleteDialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onConfirm={confirmDelete}
                queueToDelete={queueToDelete}
            />
        </Box>
    );
};

export default QueueTable;