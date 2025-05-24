import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import ErrorDisplay from "./ErrorDisplay";
import DashboardHeader from "./DashboardHeader";
import StatCardsContainer from "./StatCardsContainer";
import ChartsContainer from "./ChartsContainer";
import { calculateSuccessRate } from "./utils";
import ResourceUsageContainer from "./ResourceUsageContainer";

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
                display: "flex",
                flexDirection: "column",
                p: 3,
                overflow: "auto",
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

            <ResourceUsageContainer />
        </Box>
    );
};

export default Dashboard;
