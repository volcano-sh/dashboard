import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Grid, Button, Chip, Fade, Zoom, Card, CardContent, Typography, alpha } from "@mui/material";
import { Refresh, TrendingUp, Assignment, Queue, Computer } from "@mui/icons-material";
import { API_ENDPOINTS } from "../../config/api";

// Import custom components
import StatCard from "../Charts/StatCard";
import JobStatusPieChart from "../Charts/JobStatusPieChart";
import QueueResourcesBarChart from "../Charts/QueueResourcesBarChart";
import { 
    CHART_COLORS, 
    convertMemoryToGi, 
    convertCPUToCores, 
    getResourceUnit 
} from "../Charts/chartConfig";

const Dashboard = () => {
    const [data, setData] = useState({ jobs: [], queues: [], pods: [] });
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedResource, setSelectedResource] = useState('cpu');

    const colors = CHART_COLORS;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [jobsRes, queuesRes, podsRes] = await Promise.all([
                fetch(`${API_ENDPOINTS.jobs.list}?limit=1000`),
                fetch(`${API_ENDPOINTS.queues.list}?limit=1000`),
                fetch(`${API_ENDPOINTS.pods.list}?limit=1000`),
            ]);

            const [jobs, queues, pods] = await Promise.all([
                jobsRes.json(),
                queuesRes.json(),
                podsRes.json(),
            ]);

            setData({
                jobs: jobs.items || jobs || [],
                queues: queues.items || queues || [],
                pods: pods.items || pods || [],
            });
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => ({
        totalJobs: data.jobs.length,
        runningJobs: data.jobs.filter(j => j.status?.state?.phase === 'Running').length,
        failedJobs: data.jobs.filter(j => j.status?.state?.phase === 'Failed').length,
        completedJobs: data.jobs.filter(j => j.status?.state?.phase === 'Completed').length,
        activeQueues: data.queues.filter(q => q.status?.state === 'Open').length,
        runningPods: data.pods.filter(p => p.status?.phase === 'Running').length,
    }), [data]);

    const successRate = stats.totalJobs > 0 ? 
        ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) : 0;

    const queueResourceData = useMemo(() => {
        if (!data.queues || data.queues.length === 0) return [];

        return data.queues.slice(0, 5).map((queue) => {
            const name = queue.metadata?.name || 'Unknown';
            const allocated = queue.status?.allocated || {};
            const capability = queue.spec?.capability || {};
            const deserved = queue.spec?.deserved || {};

            let used = 0;
            let total = 0;

            switch (selectedResource) {
                case 'cpu':
                    used = convertCPUToCores(allocated.cpu || '0');
                    total = convertCPUToCores(capability.cpu || deserved.cpu || '4');
                    break;
                case 'memory':
                    used = convertMemoryToGi(allocated.memory || '0');
                    total = convertMemoryToGi(capability.memory || deserved.memory || '8Gi');
                    break;
                case 'pods':
                    used = parseInt(allocated.pods || '0');
                    total = parseInt(capability.pods || deserved.pods || '10');
                    break;
            }

            return { name, used, total };
        });
    }, [data.queues, selectedResource]);

    const availableResources = useMemo(() => {
        if (!data.queues || data.queues.length === 0) return ['cpu'];

        const resourceTypes = new Set();
        data.queues.forEach((queue) => {
            const allocated = queue.status?.allocated || {};
            Object.keys(allocated).forEach((resource) => {
                resourceTypes.add(resource);
            });
        });

        return Array.from(resourceTypes).length > 0 ? Array.from(resourceTypes) : ['cpu'];
    }, [data.queues]);

    useEffect(() => {
        if (availableResources.length > 0 && !availableResources.includes(selectedResource)) {
            setSelectedResource(availableResources[0]);
        }
    }, [availableResources, selectedResource]);

    const jobStatusData = useMemo(() => [
        { name: 'Running', value: stats.runningJobs, color: colors.primary },
        { name: 'Failed', value: stats.failedJobs, color: colors.danger },
        { name: 'Completed', value: stats.completedJobs, color: colors.success },
    ].filter(item => item.value > 0), [stats, colors]);

    return (
        <Box sx={{ 
            minHeight: '100vh',
            bgcolor: '#f8fafc',
            background: `linear-gradient(135deg, ${alpha(colors.primary, 0.05)} 0%, ${alpha(colors.secondary, 0.05)} 100%)`,
        }}>
            <Box sx={{ p: 4 }}>
                {/* Header */}
                <Fade in={true} timeout={800}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box>
                            <Typography 
                                variant="h3" 
                                fontWeight="bold" 
                                sx={{ color: colors.secondary, mb: 1 }}
                            >
                                Volcano Dashboard
                            </Typography>
                            {lastUpdated && (
                                <Chip
                                    label={`Updated ${lastUpdated.toLocaleTimeString()}`}
                                    sx={{ 
                                        bgcolor: alpha(colors.primary, 0.1), 
                                        color: colors.primary,
                                        fontWeight: 500
                                    }}
                                />
                            )}
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={loading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
                            onClick={fetchData}
                            disabled={loading}
                            sx={{
                                bgcolor: colors.primary,
                                px: 3,
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: colors.secondary,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 8px 20px ${alpha(colors.primary, 0.3)}`,
                                }
                            }}
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </Box>
                </Fade>

                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Jobs"
                            value={stats.totalJobs}
                            color={colors.secondary}
                            icon={Assignment}
                            colors={colors}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Success Rate"
                            value={`${successRate}%`}
                            color={successRate > 80 ? colors.success : successRate > 60 ? colors.warning : colors.danger}
                            icon={TrendingUp}
                            colors={colors}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Active Queues"
                            value={stats.activeQueues}
                            subtitle={`of ${data.queues.length} total`}
                            color={colors.primary}
                            icon={Queue}
                            colors={colors}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Running Pods"
                            value={stats.runningPods}
                            color={colors.success}
                            icon={Computer}
                            colors={colors}
                        />
                    </Grid>
                </Grid>

                {/* Charts */}
                <Grid container spacing={4}>
                    <Grid item xs={12} lg={6}>
                        <JobStatusPieChart 
                            jobStatusData={jobStatusData} 
                            colors={colors} 
                        />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <QueueResourcesBarChart
                            queueResourceData={queueResourceData}
                            selectedResource={selectedResource}
                            setSelectedResource={setSelectedResource}
                            availableResources={availableResources}
                            getResourceUnit={() => getResourceUnit(selectedResource)}
                            colors={colors}
                        />
                    </Grid>
                </Grid>

                {/* Status Alert */}
                {stats.failedJobs > stats.runningJobs && stats.failedJobs > 0 && (
                    <Zoom in={true} timeout={1000}>
                        <Card sx={{ 
                            mt: 4,
                            bgcolor: alpha(colors.danger, 0.1),
                            border: `1px solid ${alpha(colors.danger, 0.2)}`,
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ 
                                        p: 1, 
                                        borderRadius: 2, 
                                        bgcolor: alpha(colors.danger, 0.1),
                                        color: colors.danger,
                                        fontSize: '1.5rem'
                                    }}>
                                        ⚠️
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="h6" fontWeight="bold" sx={{ color: colors.danger }} gutterBottom>
                                            High Failure Rate Detected
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {stats.failedJobs} jobs have failed. Consider investigating recent issues.
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            borderColor: colors.danger,
                                            color: colors.danger,
                                            '&:hover': { 
                                                borderColor: colors.danger,
                                                bgcolor: alpha(colors.danger, 0.05)
                                            }
                                        }}
                                    >
                                        Investigate
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Zoom>
                )}

                {/* CSS Animation */}
                <style>
                    {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    `}
                </style>
            </Box>
        </Box>
    );
};

export default Dashboard;