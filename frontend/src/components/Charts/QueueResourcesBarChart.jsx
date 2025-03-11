import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";
import "./chartConfig";

const QueueResourcesBarChart = ({ data }) => {
    const [selectedResource, setSelectedResource] = useState("");

    // Obtain resource type options dynamically
    const resourceOptions = useMemo(() => {
        if (!data || data.length === 0) return [];

        const resourceTypes = new Set();

        // Traverse the queue data and obtain all resource types
        data.forEach((queue) => {
            const allocated = queue.status?.allocated || {};
            Object.keys(allocated).forEach((resource) =>
                resourceTypes.add(resource),
            );
        });

        // Convert resource type from Set to Array
        return Array.from(resourceTypes).map((resource) => ({
            value: resource,
            label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Resources`,
        }));
    }, [data]);

    useEffect(() => {
        // If there is a resource option, the first resource is selected by default
        if (resourceOptions.length > 0 && !selectedResource) {
            setSelectedResource(resourceOptions[0].value);
        }
    }, [resourceOptions, selectedResource]);

    const convertMemoryToGi = (memoryStr) => {
        if (!memoryStr) return 0;
        const value = parseInt(memoryStr);
        if (memoryStr.includes("Gi")) return value;
        if (memoryStr.includes("Mi")) return value / 1024; // Mi to Gi
        if (memoryStr.includes("Ki")) return value / 1024 / 1024; // Ki to Gi
        return value; // default unit Gi
    };

    const convertCPUToCores = (cpuStr) => {
        if (!cpuStr) return 0;
        const value = parseInt(cpuStr);
        if (typeof cpuStr === "number") {
            return cpuStr;
        }
        return cpuStr.includes("m") ? value / 1000 : value; // m is converted to the number of cores
    };

    // Process queue data and convert memory and CPU units
    const processData = (data) => {
        return data.reduce((acc, queue) => {
            const name = queue.metadata.name;
            const allocated = queue.status?.allocated || {};
            const capability = queue.spec?.capability || {};

            // Handle memory unit conversion
            const allocatedMemory = convertMemoryToGi(allocated.memory);
            const capabilityMemory = convertMemoryToGi(capability.memory);

            // Handle CPU unit conversion
            const allocatedCPU = convertCPUToCores(allocated.cpu);
            const capabilityCPU = convertCPUToCores(capability.cpu);

            acc[name] = {
                allocated: {
                    ...allocated,
                    memory: allocatedMemory,
                    cpu: allocatedCPU,
                },
                capability: {
                    ...capability,
                    memory: capabilityMemory,
                    cpu: capabilityCPU,
                },
            };

            return acc;
        }, {});
    };

    // Process queue data
    const processedData = useMemo(() => processData(data), [data]);

    // Build chart data
    const chartData = {
        labels: Object.keys(processedData),
        datasets: [
            {
                label: `${selectedResource.toUpperCase()} Allocated`,
                data: Object.values(processedData).map(
                    (q) => q.allocated[selectedResource] || 0,
                ),
                backgroundColor: "#2196f3",
                borderColor: "#1976d2",
                borderWidth: 1,
            },
            {
                label: `${selectedResource.toUpperCase()} Capacity`,
                data: Object.values(processedData).map(
                    (q) => q.capability[selectedResource] || 0,
                ),
                backgroundColor: "#4caf50",
                borderColor: "#388e3c",
                borderWidth: 1,
            },
        ],
    };

    // Get Y-axis label
    const getYAxisLabel = () => {
        switch (selectedResource) {
            case "memory":
                return "Memory (Gi)";
            case "cpu":
                return "CPU Cores";
            case "pods":
                return "Pod Count";
            case "nvidia.com/gpu":
                return "GPU Count";
            default:
                return "Amount";
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 10 },
                },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: getYAxisLabel(),
                },
            },
        },
        plugins: {
            legend: {
                position: "bottom",
                align: "start",
                labels: {
                    boxWidth: 12,
                    padding: 8,
                    font: { size: 11 },
                },
            },
        },
        layout: {
            padding: { bottom: 20 },
        },
    };

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Queue Resources</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        value={selectedResource}
                        onChange={(e) => setSelectedResource(e.target.value)}
                    >
                        {resourceOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, height: "calc(100% - 100px)" }}>
                {Object.keys(processedData).length > 0 ? (
                    <Bar
                        data={chartData}
                        options={options}
                        style={{ maxHeight: "100%" }}
                    />
                ) : (
                    <Typography
                        align="center"
                        color="text.secondary"
                        sx={{ mt: 4 }}
                    >
                        No data available for selected resource type
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default QueueResourcesBarChart;
