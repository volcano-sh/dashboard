import React, { useState } from "react";
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
import { trpc } from "../utils/trpc";

import StatCard from "./Charts/StatCard";
import JobStatusPieChart from "./Charts/JobStatusPieChart";
import QueueResourcesBarChart from "./Charts/QueueResourcesBarChart";

const Dashboard = () => {
    const [error, setError] = useState(null);

    // Replace fetch calls with tRPC query hooks
    const jobsQuery = trpc.jobsRouter.getAllJobs.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching jobs:", err);
                setError(`Jobs API error: ${err.message}`);
            }
        }
    );

    const queuesQuery = trpc.queueRouter.getAllQueues.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching queues:", err);
                setError(`Queues API error: ${err.message}`);
            }
        }
    );

    const podsQuery = trpc.podRouter.getAllPods.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching pods:", err);
                setError(`Pods API error: ${err.message}`);
            }
        }
    );

    // Combined loading state
    const isLoading = jobsQuery.isLoading || queuesQuery.isLoading || podsQuery.isLoading;
    
    const refreshing = jobsQuery.isRefetching || queuesQuery.isRefetching || podsQuery.isRefetching;

    const dashboardData = {
        jobs: jobsQuery.data?.items || [],
        queues: queuesQuery.data?.items || [],
        pods: podsQuery.data?.items || [],
    };

    const handleRefresh = () => {
        jobsQuery.refetch();
        queuesQuery.refetch();
        podsQuery.refetch();
    };

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