import React, { useState, useEffect, useCallback } from "react";
import { Box, Fade, Container } from "@mui/material";
import ErrorDisplay from "./ErrorDisplay";
import DashboardHeader from "./DashboardHeader";
import StatCardsContainer from "./StatCardsContainer";
import ChartsContainer from "./ChartsContainer";
import Loader from "../common/Loader";

/**
 * Main Dashboard component that fetches and displays all dashboard data
 * Implements proper loading states and error handling
 */
const Dashboard = () => {
    // Data state
    const [dashboardData, setDashboardData] = useState({
        jobs: [],
        queues: [],
        pods: [],
    });

    const [isLoading, setIsLoading] = useState(true); // Initial loading
    const [isRefreshing, setIsRefreshing] = useState(false); // Refresh loading
    const [error, setError] = useState(null);
    const [componentErrors, setComponentErrors] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    /**
     * Fetches all data required for the dashboard
     */
    const fetchAllData = useCallback(async (isRefresh = false) => {
        // Set appropriate loading state
        if (!isRefresh) {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }

        // Clear any previous errors
        setError(null);
        setComponentErrors({});

        try {
            // Fetch all data concurrently
            const [jobsRes, queuesRes, podsRes] = await Promise.all([
                fetch("/api/jobs?limit=1000"),
                fetch("/api/queues?limit=1000"),
                fetch("/api/pods?limit=1000"),
            ]);

            // Create new component errors object
            const newComponentErrors = {};

            // Process job response
            let jobsData = { items: [] };
            if (!jobsRes.ok) {
                newComponentErrors.jobs = `Jobs API error: ${jobsRes.status}`;
            } else {
                jobsData = await jobsRes.json();
            }

            // Process queue response
            let queuesData = { items: [] };
            if (!queuesRes.ok) {
                newComponentErrors.queues = `Queues API error: ${queuesRes.status}`;
            } else {
                queuesData = await queuesRes.json();
            }

            // Process pods response
            let podsData = { items: [] };
            if (!podsRes.ok) {
                newComponentErrors.pods = `Pods API error: ${podsRes.status}`;
            } else {
                podsData = await podsRes.json();
            }

            // Update component errors if any
            if (Object.keys(newComponentErrors).length > 0) {
                setComponentErrors(newComponentErrors);
            }

            // Update dashboard data
            setDashboardData({
                jobs: jobsData.items || [],
                queues: queuesData.items || [],
                pods: podsData.items || [],
            });

            // Update last updated timestamp on successful fetch
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError(error.message || "Failed to fetch dashboard data");
        } finally {
            // Reset loading states
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    /**
     * Handler for refresh button click
     */
    const handleRefresh = () => {
        // Don't allow multiple concurrent refresh requests
        if (!isRefreshing) {
            fetchAllData(true);
        }
    };

    // Initial data fetch on component mount
    useEffect(() => {
        fetchAllData(false);
    }, [fetchAllData]);

    // Show full-screen loader for initial load
    if (isLoading && !dashboardData.jobs.length) {
        return (
            <Container maxWidth="lg" sx={{ height: "100vh" }}>
                <Loader
                    message="Loading dashboard data..."
                    showMessage={true}
                    size={60}
                />
            </Container>
        );
    }

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                p: 3,
                transition: "opacity 0.3s ease-in-out",
                opacity: isRefreshing ? 0.7 : 1,
            }}
        >
            {/* Global Error Display */}
            {error && <ErrorDisplay message={error} onRetry={handleRefresh} />}

            {/* Dashboard Header */}
            <DashboardHeader
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                lastUpdated={lastUpdated}
            />

            {/* Stats Cards Section */}
            <StatCardsContainer
                jobs={dashboardData.jobs}
                queues={dashboardData.queues}
                pods={dashboardData.pods}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
            />

            {/* Charts Section */}
            <ChartsContainer
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                jobs={dashboardData.jobs}
                queues={dashboardData.queues}
                errors={componentErrors}
            />
        </Box>
    );
};

export default Dashboard;
