import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import ErrorDisplay from "./ErrorDisplay";
import DashboardHeader from "./DashboardHeader";
import StatCardsContainer from "./StatCardsContainer";
import ChartsContainer from "./ChartsContainer";

const Dashboard = () => {
    const { t } = useTranslation();
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
                throw { key: "dashboard.apiError.jobs", params: { status: jobsRes.status } };
            if (!queuesRes.ok)
                throw { key: "dashboard.apiError.queues", params: { status: queuesRes.status } };
            if (!podsRes.ok)
                throw { key: "dashboard.apiError.pods", params: { status: podsRes.status } };

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
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            // If the error has a translation key (our custom throws)
            if (err.key) {
                setError(err);
            } 
            // fetch() throws a TypeError on network failures (e.g., connection refused)
            else if (err.name === "TypeError" || err.message === "Failed to fetch") {
                setError({ key: "dashboard.apiError.network" });
            } 
            // Fallback for other arbitrary errors
            else {
                setError({ message: err.message });
            }
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

    const getErrorMessage = () => {
        if (!error) return null;
        if (error.key) return t(error.key, error.params);
        return error.message;
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
            {error && <ErrorDisplay message={getErrorMessage()} />}

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
