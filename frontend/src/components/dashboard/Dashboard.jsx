import React, { useState } from "react";
import { Box } from "@mui/material";
import ErrorDisplay from "./ErrorDisplay";
import DashboardHeader from "./DashboardHeader";
import StatCardsContainer from "./StatCardsContainer";
import ChartsContainer from "./ChartsContainer";
import { trpc } from "../../utils/trpc";

const Dashboard = () => {
    const [error, setError] = useState(null);

    const jobsQuery = trpc.jobsRouter.getAllJobs.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching jobs:", err);
                setError(`Jobs API error: ${err.message}`);
            },
        },
    );

    const queuesQuery = trpc.queueRouter.getAllQueues.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching queues:", err);
                setError(`Queues API error: ${err.message}`);
            },
        },
    );

    const podsQuery = trpc.podRouter.getAllPods.useQuery(
        { limit: 1000 },
        {
            onError: (err) => {
                console.error("Error fetching pods:", err);
                setError(`Pods API error: ${err.message}`);
            },
        },
    );

    // Combined loading state
    const isLoading =
        jobsQuery.isLoading || queuesQuery.isLoading || podsQuery.isLoading;

    const refreshing =
        jobsQuery.isRefetching ||
        queuesQuery.isRefetching ||
        podsQuery.isRefetching;

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
        </Box>
    );
};

export default Dashboard;
