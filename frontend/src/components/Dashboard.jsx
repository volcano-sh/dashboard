import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import StatCard from "./Charts/StatCard";
import JobStatusPieChart from "./Charts/JobStatusPieChart";
import QueueResourcesBarChart from "./Charts/QueueResourcesBarChart";

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        jobs: [],
        queues: [],
        pods: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchAllData = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const [jobsRes, queuesRes, podsRes] = await Promise.all([
                fetch("/api/jobs?limit=1000"),
                fetch("/api/queues?limit=1000"),
                fetch("/api/pods?limit=1000"),
            ]);

            if (!jobsRes.ok)
                throw new Error(`Jobs API error: ${jobsRes.status}`);
            if (!queuesRes.ok)
                throw new Error(`Queues API error: ${queuesRes.status}`);
            if (!podsRes.ok)
                throw new Error(`Pods API error: ${podsRes.status}`);

            const [jobsData, queuesData, podsData] = await Promise.all([
                jobsRes.json(),
                queuesRes.json(),
                podsRes.json(),
            ]);

            setDashboardData({
                jobs: jobsData.items || [],
                queues: queuesData.items || [],
                pods: podsData.items || [],
            });
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

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                p: 3,
            }}
        >
            {error && (
                <Paper
                    sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: "error.light",
                        color: "error.contrastText",
                    }}
                >
                    <Typography>{error}</Typography>
                </Paper>
            )}

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Typography variant="h4">Volcano Dashboard</Typography>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={handleRefresh} disabled={refreshing}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Jobs"
                        value={dashboardData.jobs?.length || 0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Queues"
                        value={
                            dashboardData.queues?.filter(
                                (q) => q.status?.state === "Open",
                            )?.length || 0
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Running Pods"
                        value={
                            dashboardData.pods?.filter(
                                (p) => p.status?.phase === "Running",
                            )?.length || 0
                        }
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Complete Rate"
                        value={`${calculateSuccessRate(dashboardData.jobs)}%`}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ flex: 1, minHeight: 0, mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            height: "calc(100vh - 250px)",
                            display: "flex",
                            flexDirection: "column",
                            p: 2,
                        }}
                    >
                        {isLoading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flex: 1,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ height: "100%" }}>
                                <JobStatusPieChart data={dashboardData.jobs} />
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            height: "calc(100vh - 250px)",
                            display: "flex",
                            flexDirection: "column",
                            p: 2,
                        }}
                    >
                        {isLoading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flex: 1,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ height: "100%" }}>
                                <QueueResourcesBarChart
                                    data={dashboardData.queues}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

const calculateSuccessRate = (jobs) => {
    if (!jobs || jobs.length === 0) return 0;
    const completed = jobs.filter(
        (job) =>
            job.status?.succeeded || job.status?.state?.phase === "Completed",
    ).length;
    const finished = jobs.filter(
        (job) =>
            job.status?.succeeded ||
            job.status?.failed ||
            job.status?.state?.phase === "Completed" ||
            job.status?.state?.phase === "Failed",
    ).length;
    return finished === 0 ? 0 : Math.round((completed / finished) * 100);
};

export default Dashboard;
