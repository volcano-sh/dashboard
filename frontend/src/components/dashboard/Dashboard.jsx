import { useState, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import ErrorDisplay from "./ErrorDisplay";
import DashboardHeader from "./DashboardHeader";
import StatCardsContainer from "./StatCardsContainer";
import ChartsContainer from "./ChartsContainer";
import ResourceChart from "./ResourceChart";

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        jobs: [],
        queues: [],
        pods: [],
    });
    const [clusterMetrics, setClusterMetrics] = useState({
        nodes: [],
        pods: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchAllData = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const [jobsRes, queuesRes, podsRes, metricsRes] = await Promise.all(
                [
                    fetch("/api/jobs?limit=1000"),
                    fetch("/api/queues?limit=1000"),
                    fetch("/api/pods?limit=1000"),
                    fetch("/api/metrics"),
                ],
            );

            if (!jobsRes.ok)
                throw new Error(`Jobs API error: ${jobsRes.status}`);
            if (!queuesRes.ok)
                throw new Error(`Queues API error: ${queuesRes.status}`);
            if (!podsRes.ok)
                throw new Error(`Pods API error: ${podsRes.status}`);
            if (!metricsRes.ok)
                throw new Error(`Metrics API error: ${metricsRes.status}`);

            const [jobsData, queuesData, podsData, metricsData] =
                await Promise.all([
                    jobsRes.json(),
                    queuesRes.json(),
                    podsRes.json(),
                    metricsRes.json(),
                ]);

            setDashboardData({
                jobs: jobsData.items || [],
                queues: queuesData.items || [],
                pods: podsData.items || [],
            });
            setClusterMetrics(metricsData);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError(error.message);
        } finally {
            setRefreshing(false);
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchAllData();
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const calculateTotalResources = () => {
        const totals = {
            cpuUsage: 0,
            memoryUsage: 0,
            cpuLimit: 0,
            memoryLimit: 0,
        };

        clusterMetrics.nodes?.forEach((node) => {
            totals.cpuUsage += node.metrics?.cpu || 0;
            totals.memoryUsage += node.metrics?.memory || 0;
            totals.cpuLimit += node.allocatable?.cpu || 0;
            totals.memoryLimit += node.allocatable?.memory || 0;
        });

        return totals;
    };

    const calculateQueueResources = () => {
        const queueResources = {};

        clusterMetrics.pods?.forEach((pod) => {
            const queue = pod.spec?.queue || "default";
            if (!queueResources[queue]) {
                queueResources[queue] = {
                    cpuUsage: 0,
                    memoryUsage: 0,
                    cpuLimit: 0,
                    memoryLimit: 0,
                };
            }

            queueResources[queue].cpuUsage += pod.metrics?.cpu || 0;
            queueResources[queue].memoryUsage += pod.metrics?.memory || 0;
            pod.spec?.containers?.forEach((container) => {
                queueResources[queue].cpuLimit +=
                    container.resources?.limits?.cpu || 0;
                queueResources[queue].memoryLimit +=
                    container.resources?.limits?.memory || 0;
            });
        });

        return queueResources;
    };

    const totalResources = calculateTotalResources();
    const queueResources = calculateQueueResources();

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                p: 3,
            }}
        >
            {error && <ErrorDisplay message={error} />}

            <DashboardHeader
                onRefresh={handleRefresh}
                refreshing={refreshing}
            />

            <StatCardsContainer
                jobs={dashboardData.jobs}
                queues={dashboardData.queues}
                pods={dashboardData.pods}
            />

            <ChartsContainer
                isLoading={isLoading}
                jobs={dashboardData.jobs}
                queues={dashboardData.queues}
            />

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>
                        Cluster Resources
                    </Typography>
                    <ResourceChart
                        cpuUsage={totalResources.cpuUsage}
                        memoryUsage={totalResources.memoryUsage}
                        cpuLimit={totalResources.cpuLimit}
                        memoryLimit={totalResources.memoryLimit}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                        Queue Resources
                    </Typography>
                    <Grid container spacing={3}>
                        {Object.entries(queueResources).map(
                            ([queue, resources]) => (
                                <Grid item xs={12} md={6} key={queue}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {queue}
                                        </Typography>
                                        <ResourceChart
                                            cpuUsage={resources.cpuUsage}
                                            memoryUsage={resources.memoryUsage}
                                            cpuLimit={resources.cpuLimit}
                                            memoryLimit={resources.memoryLimit}
                                        />
                                    </Box>
                                </Grid>
                            ),
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
