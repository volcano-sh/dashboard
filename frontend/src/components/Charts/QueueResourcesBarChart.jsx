import React, { useEffect, useMemo, useState, useCallback } from "react";
import { 
    Box, 
    FormControl, 
    MenuItem, 
    Select, 
    Typography, 
    Alert,
    Skeleton,
    Chip,
    Tooltip,
    useTheme,
    alpha
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MemoryIcon from "@mui/icons-material/Memory";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import CloudIcon from "@mui/icons-material/Cloud";
import "./chartConfig";

// Resource type configuration with metadata
const RESOURCE_CONFIG = {
    memory: {
        label: "Memory Resources",
        unit: "Gi",
        icon: MemoryIcon,
        color: "#2196f3",
        description: "Memory allocation and capacity"
    },
    cpu: {
        label: "CPU Resources", 
        unit: "Cores",
        icon: DeveloperBoardIcon,
        color: "#ff9800",
        description: "CPU cores allocation and capacity"
    },
    pods: {
        label: "Pod Resources",
        unit: "Count",
        icon: CloudIcon,
        color: "#4caf50",
        description: "Pod count allocation and capacity"
    },
    "nvidia.com/gpu": {
        label: "GPU Resources",
        unit: "Count", 
        icon: DeveloperBoardIcon,
        color: "#9c27b0",
        description: "GPU allocation and capacity"
    }
};

// Enhanced unit conversion utilities
const UnitConverter = {
    memory: {
        toGi: (memoryStr) => {
            if (!memoryStr || memoryStr === "0") return 0;
            
            // Handle numeric values
            if (typeof memoryStr === "number") return memoryStr;
            
            const numericValue = parseFloat(memoryStr);
            if (isNaN(numericValue)) return 0;
            
            const unit = memoryStr.replace(/[0-9.-]/g, "").toLowerCase();
            
            switch (unit) {
                case "gi":
                case "g":
                    return numericValue;
                case "mi":
                case "m":
                    return numericValue / 1024;
                case "ki":
                case "k":
                    return numericValue / (1024 * 1024);
                case "ti":
                case "t":
                    return numericValue * 1024;
                default:
                    return numericValue; // Assume Gi as default
            }
        }
    },
    
    cpu: {
        toCores: (cpuStr) => {
            if (!cpuStr || cpuStr === "0") return 0;
            
            // Handle numeric values
            if (typeof cpuStr === "number") return cpuStr;
            
            const numericValue = parseFloat(cpuStr);
            if (isNaN(numericValue)) return 0;
            
            // Handle millicores (m suffix)
            if (cpuStr.toString().includes("m")) {
                return numericValue / 1000;
            }
            
            return numericValue;
        }
    }
};

const QueueResourcesBarChart = ({ data, loading = false, error = null }) => {
    const theme = useTheme();
    const [selectedResource, setSelectedResource] = useState("");
    const [hoveredQueue, setHoveredQueue] = useState(null);

    // Enhanced data validation
    const isValidData = useMemo(() => {
        return Array.isArray(data) && data.length > 0;
    }, [data]);

    // Dynamic resource options with enhanced metadata
    const resourceOptions = useMemo(() => {
        if (!isValidData) return [];

        const resourceTypes = new Set();
        let totalQueues = 0;

        data.forEach((queue) => {
            if (queue?.status?.allocated || queue?.spec?.capability) {
                totalQueues++;
                const allocated = queue.status?.allocated || {};
                const capability = queue.spec?.capability || {};
                
                // Collect resource types from both allocated and capability
                [...Object.keys(allocated), ...Object.keys(capability)].forEach((resource) => {
                    if (resource && (allocated[resource] || capability[resource])) {
                        resourceTypes.add(resource);
                    }
                });
            }
        });

        return Array.from(resourceTypes).map((resource) => {
            const config = RESOURCE_CONFIG[resource] || {
                label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Resources`,
                unit: "Count",
                color: "#607d8b",
                description: `${resource} allocation and capacity`
            };
            
            return {
                value: resource,
                ...config,
                queuesCount: totalQueues
            };
        }).sort((a, b) => a.label.localeCompare(b.label));
    }, [data, isValidData]);

    // Auto-select first resource with error handling
    useEffect(() => {
        if (resourceOptions.length > 0 && !selectedResource) {
            // Prioritize common resources
            const priority = ["cpu", "memory", "pods", "nvidia.com/gpu"];
            const priorityResource = priority.find(p => 
                resourceOptions.some(r => r.value === p)
            );
            
            setSelectedResource(priorityResource || resourceOptions[0].value);
        }
    }, [resourceOptions, selectedResource]);

    // Enhanced data processing with better error handling
    const processedData = useMemo(() => {
        if (!isValidData) return {};

        return data.reduce((acc, queue, index) => {
            try {
                const name = queue?.metadata?.name || `Queue-${index + 1}`;
                const allocated = queue?.status?.allocated || {};
                const capability = queue?.spec?.capability || {};

                // Process each resource type with appropriate converter
                const processedAllocated = {};
                const processedCapability = {};

                Object.keys({ ...allocated, ...capability }).forEach(resourceType => {
                    let allocatedValue = allocated[resourceType] || 0;
                    let capabilityValue = capability[resourceType] || 0;

                    // Apply appropriate conversion based on resource type
                    if (resourceType === "memory") {
                        allocatedValue = UnitConverter.memory.toGi(allocatedValue);
                        capabilityValue = UnitConverter.memory.toGi(capabilityValue);
                    } else if (resourceType === "cpu") {
                        allocatedValue = UnitConverter.cpu.toCores(allocatedValue);
                        capabilityValue = UnitConverter.cpu.toCores(capabilityValue);
                    } else {
                        // For other resources, ensure numeric values
                        allocatedValue = parseFloat(allocatedValue) || 0;
                        capabilityValue = parseFloat(capabilityValue) || 0;
                    }

                    processedAllocated[resourceType] = allocatedValue;
                    processedCapability[resourceType] = capabilityValue;
                });

                acc[name] = {
                    allocated: processedAllocated,
                    capability: processedCapability,
                    utilizationRate: processedCapability[selectedResource] > 0 
                        ? (processedAllocated[selectedResource] / processedCapability[selectedResource] * 100)
                        : 0
                };

                return acc;
            } catch (err) {
                console.warn(`Error processing queue data at index ${index}:`, err);
                return acc;
            }
        }, {});
    }, [data, isValidData, selectedResource]);

    // Enhanced chart data with better styling
    const chartData = useMemo(() => {
        const queueNames = Object.keys(processedData);
        const selectedConfig = RESOURCE_CONFIG[selectedResource] || { color: "#607d8b" };
        
        return {
            labels: queueNames,
            datasets: [
                {
                    label: `Allocated ${selectedConfig.unit}`,
                    data: Object.values(processedData).map(q => 
                        Number((q.allocated[selectedResource] || 0).toFixed(2))
                    ),
                    backgroundColor: alpha(selectedConfig.color, 0.7),
                    borderColor: selectedConfig.color,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                },
                {
                    label: `Capacity ${selectedConfig.unit}`,
                    data: Object.values(processedData).map(q => 
                        Number((q.capability[selectedResource] || 0).toFixed(2))
                    ),
                    backgroundColor: alpha(theme.palette.success.main, 0.7),
                    borderColor: theme.palette.success.main,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }
            ]
        };
    }, [processedData, selectedResource, theme]);

    // Enhanced chart options with accessibility
    const chartOptions = useMemo(() => {
        const selectedConfig = RESOURCE_CONFIG[selectedResource] || { unit: "Count" };
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 0,
                        font: { 
                            size: 11,
                            family: theme.typography.fontFamily 
                        },
                        color: theme.palette.text.secondary,
                    },
                    grid: { 
                        display: false 
                    },
                    title: {
                        display: true,
                        text: 'Queue Names',
                        font: { 
                            size: 12,
                            weight: 'bold',
                            family: theme.typography.fontFamily 
                        },
                        color: theme.palette.text.primary,
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `${selectedConfig.label} (${selectedConfig.unit})`,
                        font: { 
                            size: 12,
                            weight: 'bold',
                            family: theme.typography.fontFamily 
                        },
                        color: theme.palette.text.primary,
                    },
                    ticks: {
                        font: { 
                            size: 10,
                            family: theme.typography.fontFamily 
                        },
                        color: theme.palette.text.secondary,
                        callback: function(value) {
                            // Format large numbers
                            if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K';
                            }
                            return Number(value).toFixed(selectedResource === 'cpu' ? 1 : 0);
                        }
                    },
                    grid: {
                        color: alpha(theme.palette.divider, 0.1),
                    }
                }
            },
            plugins: {
                legend: {
                    position: "top",
                    align: "end",
                    labels: {
                        boxWidth: 12,
                        padding: 16,
                        font: { 
                            size: 11,
                            family: theme.typography.fontFamily 
                        },
                        color: theme.palette.text.primary,
                        usePointStyle: true,
                        pointStyle: 'rect'
                    }
                },
                tooltip: {
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    titleColor: theme.palette.text.primary,
                    bodyColor: theme.palette.text.secondary,
                    borderColor: theme.palette.divider,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return `Queue: ${context[0].label}`;
                        },
                        afterBody: function(context) {
                            const queueName = context[0].label;
                            const queueData = processedData[queueName];
                            if (queueData) {
                                const utilization = queueData.capability[selectedResource] > 0 
                                    ? (queueData.allocated[selectedResource] / queueData.capability[selectedResource] * 100)
                                    : 0;
                                return `Utilization: ${utilization.toFixed(1)}%`;
                            }
                            return '';
                        }
                    }
                }
            },
            layout: {
                padding: { 
                    top: 10,
                    bottom: 20,
                    left: 10,
                    right: 10
                }
            },
            onHover: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const queueName = Object.keys(processedData)[index];
                    setHoveredQueue(queueName);
                } else {
                    setHoveredQueue(null);
                }
            }
        };
    }, [selectedResource, theme, processedData]);

    // Handle resource selection change
    const handleResourceChange = useCallback((event) => {
        setSelectedResource(event.target.value);
        setHoveredQueue(null); // Reset hover state
    }, []);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!selectedResource || Object.keys(processedData).length === 0) {
            return null;
        }

        const values = Object.values(processedData);
        const totalAllocated = values.reduce((sum, q) => sum + (q.allocated[selectedResource] || 0), 0);
        const totalCapacity = values.reduce((sum, q) => sum + (q.capability[selectedResource] || 0), 0);
        const avgUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity * 100) : 0;

        return {
            totalAllocated: totalAllocated.toFixed(selectedResource === 'cpu' ? 1 : 0),
            totalCapacity: totalCapacity.toFixed(selectedResource === 'cpu' ? 1 : 0),
            avgUtilization: avgUtilization.toFixed(1),
            queuesCount: values.length
        };
    }, [processedData, selectedResource]);

    // Error handling
    if (error) {
        return (
            <Alert 
                severity="error" 
                sx={{ m: 2 }}
                action={
                    <Typography variant="body2" color="error">
                        Unable to load queue resources data
                    </Typography>
                }
            >
                {error.message || "An error occurred while loading the chart"}
            </Alert>
        );
    }

    // Loading state
    if (loading) {
        return (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height="calc(100% - 60px)" />
            </Box>
        );
    }

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Enhanced Header with Statistics */}
            <Box sx={{ mb: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                    }}
                >
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 1,
                            fontWeight: 600 
                        }}
                    >
                        <TrendingUpIcon color="primary" />
                        Queue Resources Analysis
                    </Typography>
                    
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select
                            value={selectedResource}
                            onChange={handleResourceChange}
                            aria-label="Select resource type"
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.divider,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main,
                                }
                            }}
                        >
                            {resourceOptions.map((option) => {
                                const IconComponent = option.icon;
                                return (
                                    <MenuItem key={option.value} value={option.value}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <IconComponent sx={{ fontSize: 16, color: option.color }} />
                                            {option.label}
                                        </Box>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                </Box>

                {/* Summary Statistics */}
                {summaryStats && (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Tooltip title="Total allocated resources across all queues">
                            <Chip
                                size="small"
                                label={`Allocated: ${summaryStats.totalAllocated} ${RESOURCE_CONFIG[selectedResource]?.unit || 'units'}`}
                                color="primary"
                                variant="outlined"
                            />
                        </Tooltip>
                        <Tooltip title="Total capacity across all queues">
                            <Chip
                                size="small"
                                label={`Capacity: ${summaryStats.totalCapacity} ${RESOURCE_CONFIG[selectedResource]?.unit || 'units'}`}
                                color="success"
                                variant="outlined"
                            />
                        </Tooltip>
                        <Tooltip title="Average utilization percentage">
                            <Chip
                                size="small"
                                label={`Avg Utilization: ${summaryStats.avgUtilization}%`}
                                color={parseFloat(summaryStats.avgUtilization) > 80 ? "error" : "default"}
                                variant="outlined"
                            />
                        </Tooltip>
                        <Chip
                            size="small"
                            label={`${summaryStats.queuesCount} Queues`}
                            variant="outlined"
                        />
                    </Box>
                )}
            </Box>

            {/* Chart Container */}
            <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
                {Object.keys(processedData).length > 0 ? (
                    <Bar
                        data={chartData}
                        options={chartOptions}
                        style={{ maxHeight: "100%" }}
                        aria-label={`Bar chart showing ${selectedResource} allocation vs capacity for each queue`}
                    />
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            color: "text.secondary"
                        }}
                    >
                        <CloudIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" gutterBottom>
                            No Data Available
                        </Typography>
                        <Typography variant="body2" align="center">
                            {!isValidData 
                                ? "No queue data provided" 
                                : "No resource data available for the selected resource type"
                            }
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default QueueResourcesBarChart;