import React, { useState } from "react";
import PropTypes from "prop-types";
import {
    Box,
    Card,
    CardContent,
    Typography,
    useTheme,
    alpha,
    LinearProgress,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import { Memory, Speed } from "@mui/icons-material";

const ResourceChart = ({ cpuUsage, memoryUsage, cpuLimit, memoryLimit }) => {
    const theme = useTheme();
    const [selectedResources, setSelectedResources] = useState([
        "cpu",
        "memory",
    ]);

    const getResourceColor = (usage, limit) => {
        const percentage = (usage / limit) * 100;
        if (percentage >= 90) return theme.palette.error.main;
        if (percentage >= 70) return theme.palette.warning.main;
        return theme.palette.success.main;
    };

    const formatMemory = (value) => {
        if (value >= 1024) {
            return `${(value / 1024).toFixed(1)} GB`;
        }
        return `${Math.round(value)} MB`;
    };

    const formatCPU = (value) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)} cores`;
        }
        return `${value} millicores`;
    };

    const handleResourceChange = (event) => {
        setSelectedResources(event.target.value);
    };

    const renderResourceBar = (type) => {
        const isMemory = type === "memory";
        const usage = isMemory ? memoryUsage : cpuUsage;
        const limit = isMemory ? memoryLimit : cpuLimit;
        const Icon = isMemory ? Memory : Speed;
        const formatValue = isMemory ? formatMemory : formatCPU;

        return (
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Icon
                        sx={{
                            mr: 1,
                            color: getResourceColor(usage, limit),
                        }}
                    />
                    <Typography variant="subtitle2">
                        {isMemory ? "Memory" : "CPU"}
                    </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min((usage / limit) * 100, 100)}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1,
                            ),
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: getResourceColor(usage, limit),
                                borderRadius: 4,
                            },
                        }}
                    />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                        Used: {formatValue(usage)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Limit: {formatValue(limit)}
                    </Typography>
                </Box>
            </Box>
        );
    };

    return (
        <Card
            sx={{
                background: `linear-gradient(to bottom right, ${alpha(
                    theme.palette.background.paper,
                    0.9,
                )}, ${theme.palette.background.paper})`,
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                    }}
                >
                    <Typography variant="h6">Resource Usage</Typography>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Show Resources</InputLabel>
                        <Select
                            multiple
                            value={selectedResources}
                            onChange={handleResourceChange}
                            label="Show Resources"
                            size="small"
                        >
                            <MenuItem value="cpu">CPU</MenuItem>
                            <MenuItem value="memory">Memory</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Grid container spacing={3}>
                    {selectedResources.map((resource) => (
                        <Grid item xs={12} key={resource}>
                            {renderResourceBar(resource)}
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

ResourceChart.propTypes = {
    cpuUsage: PropTypes.number.isRequired,
    memoryUsage: PropTypes.number.isRequired,
    cpuLimit: PropTypes.number.isRequired,
    memoryLimit: PropTypes.number.isRequired,
};

export default ResourceChart;
