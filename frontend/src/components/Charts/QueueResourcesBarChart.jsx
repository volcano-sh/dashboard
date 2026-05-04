import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";
import "./chartConfig";

const convertMemoryToGi = (memoryStr) => {
    if (!memoryStr) return 0;
    if (typeof memoryStr === "number") return memoryStr;
    const value = parseFloat(memoryStr);
    if (isNaN(value)) return 0;
    if (memoryStr.includes("Ti")) return value * 1024;
    if (memoryStr.includes("Gi")) return value;
    if (memoryStr.includes("Mi")) return value / 1024;
    if (memoryStr.includes("Ki")) return value / (1024 * 1024);
    return value;
};

const convertCPUToCores = (cpuStr) => {
    if (!cpuStr) return 0;
    if (typeof cpuStr === "number") return cpuStr;
    const value = parseFloat(cpuStr);
    if (isNaN(value)) return 0;
    return cpuStr.endsWith("m") ? value / 1000 : value;
};

const processData = (data) => {
    if (!data || !Array.isArray(data)) return {};
    return data.reduce((acc, queue) => {
        const name = queue?.metadata?.name;
        if (!name) return acc;
        const allocated = queue.status?.allocated || {};
        const capability = queue.spec?.capability || {};

        acc[name] = {
            allocated: {
                ...allocated,
                memory: convertMemoryToGi(allocated.memory),
                cpu: convertCPUToCores(allocated.cpu),
            },
            capability: {
                ...capability,
                memory: convertMemoryToGi(capability.memory),
                cpu: convertCPUToCores(capability.cpu),
            },
        };

        return acc;
    }, {});
};

const QueueResourcesBarChart = ({ data }) => {
    const [selectedResource, setSelectedResource] = useState("");

    const resourceOptions = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return [];

        const resourceTypes = new Set();
        data.forEach((queue) => {
            const allocated = queue.status?.allocated || {};
            Object.keys(allocated).forEach((resource) =>
                resourceTypes.add(resource),
            );
        });

        return Array.from(resourceTypes).map((resource) => ({
            value: resource,
            label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Resources`,
        }));
    }, [data]);

    useEffect(() => {
        if (resourceOptions.length > 0 && !selectedResource) {
            setSelectedResource(resourceOptions[0].value);
        }
        if (resourceOptions.length === 0) {
            setSelectedResource("");
        }
    }, [resourceOptions, selectedResource]);

    const processedData = useMemo(() => processData(data), [data]);

    const getYAxisLabel = useMemo(() => {
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
                return selectedResource ? `${selectedResource} Amount` : "Amount";
        }
    }, [selectedResource]);

    const chartData = useMemo(() => ({
        labels: Object.keys(processedData),
        datasets: [
            {
                label: `${selectedResource.toUpperCase()} Allocated`,
                data: Object.values(processedData).map(
                    (q) => q.allocated[selectedResource] ?? 0,
                ),
                backgroundColor: "#2196f3",
                borderColor: "#1976d2",
                borderWidth: 1,
            },
            {
                label: `${selectedResource.toUpperCase()} Capacity`,
                data: Object.values(processedData).map(
                    (q) => q.capability[selectedResource] ?? 0,
                ),
                backgroundColor: "#4caf50",
                borderColor: "#388e3c",
                borderWidth: 1,
            },
        ],
    }), [processedData, selectedResource]);

    const options = useMemo(() => ({
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
                    text: getYAxisLabel,
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
    }), [getYAxisLabel]);

    const isEmpty = !data || !Array.isArray(data) || data.length === 0;

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
                {!isEmpty && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={selectedResource}
                            onChange={(e) => setSelectedResource(e.target.value)}
                            displayEmpty
                        >
                            {resourceOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, height: "calc(100% - 100px)" }}>
                {isEmpty ? (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        <Typography
                            align="center"
                            color="text.secondary"
                        >
                            No queue resource data available
                        </Typography>
                    </Box>
                ) : Object.keys(processedData).length > 0 && selectedResource ? (
                    <Bar
                        data={chartData}
                        options={options}
                        style={{ maxHeight: "100%" }}
                    />
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        <Typography align="center" color="text.secondary">
                            No data available for the selected resource type
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default QueueResourcesBarChart;
