// Fixed JobTable.jsx with Working Expand/Collapse
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
import JobTableRow from "./JobTableRow";

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

const JobTable = ({
    jobs,
    handleJobClick,
    filters,
    uniqueStatuses,
    allNamespaces,
    allQueues,
    onFilterChange,
    sortDirection,
    toggleSortDirection,
}) => {
    const theme = useTheme();
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const activeFiltersCount = Object.values(filters).filter(value => value !== "All" && value !== "default").length;

    const clearAllFilters = () => {
        onFilterChange('namespace', 'default');
        onFilterChange('queue', 'All');
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
                        <InputLabel>Namespace</InputLabel>
                        <Select
                            value={filters.namespace}
                            label="Namespace"
                            onChange={(e) => onFilterChange('namespace', e.target.value)}
                        >
                            {allNamespaces.map(ns => (
                                <MenuItem key={ns} value={ns}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ 
                                            width: 6, 
                                            height: 6, 
                                            borderRadius: '50%', 
                                            backgroundColor: ns === 'default' ? 'primary.main' : 'secondary.main' 
                                        }} />
                                        {ns}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </CompactFormControl>

                    <CompactFormControl size="small">
                        <InputLabel>Queue</InputLabel>
                        <Select
                            value={filters.queue}
                            label="Queue"
                            onChange={(e) => onFilterChange('queue', e.target.value)}
                        >
                            {allQueues
                                .filter((queue, index, arr) => arr.indexOf(queue) === index)
                                .map(queue => (
                                    <MenuItem key={queue} value={queue}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ 
                                                width: 6, 
                                                height: 6, 
                                                borderRadius: '2px', 
                                                backgroundColor: queue === 'All' ? 'text.secondary' : 'warning.main' 
                                            }} />
                                            {queue}
                                        </Box>
                                    </MenuItem>
                                ))}
                        </Select>
                    </CompactFormControl>

                    <CompactFormControl size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters.status}
                            label="Status"
                            onChange={(e) => onFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="All">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'text.secondary' }} />
                                    All
                                </Box>
                            </MenuItem>
                            <MenuItem value="Running">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'success.main' }} />
                                    Running
                                </Box>
                            </MenuItem>
                            <MenuItem value="Failed">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'error.main' }} />
                                    Failed
                                </Box>
                            </MenuItem>
                            <MenuItem value="Succeeded">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'info.main' }} />
                                    Succeeded
                                </Box>
                            </MenuItem>
                            <MenuItem value="Pending">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'warning.main' }} />
                                    Pending
                                </Box>
                            </MenuItem>
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
                            {filters.namespace !== 'default' && (
                                <Chip 
                                    label={`Namespace: ${filters.namespace}`} 
                                    size="small"
                                    onDelete={() => onFilterChange('namespace', 'default')}
                                    sx={{ height: 24, fontSize: '12px' }}
                                />
                            )}
                            {filters.queue !== 'All' && (
                                <Chip 
                                    label={`Queue: ${filters.queue}`} 
                                    size="small"
                                    onDelete={() => onFilterChange('queue', 'All')}
                                    sx={{ height: 24, fontSize: '12px' }}
                                />
                            )}
                            {filters.status !== 'All' && (
                                <Chip 
                                    label={`Status: ${filters.status}`} 
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
                            <TableCell>Namespace</TableCell>
                            <TableCell>Queue</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Creation Time
                                    <IconButton 
                                        size="small" 
                                        onClick={toggleSortDirection}
                                        sx={{
                                            color: 'primary.main',
                                            width: 24,
                                            height: 24,
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                            }
                                        }}
                                    >
                                        {sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                                    </IconButton>
                                </Box>
                            </TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <JobTableRow
                                key={`${job.metadata.namespace}-${job.metadata.name}`}
                                job={job}
                                handleJobClick={handleJobClick}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default JobTable;