import React from "react";
import { Box, Grid, Paper, CircularProgress } from "@mui/material";
import JobStatusPieChart from "../Charts/JobStatusPieChart";
import QueueResourcesBarChart from "../Charts/QueueResourcesBarChart";
import Loader from "../common/Loader";

/**
 * Wrapper component for charts that handles loading state
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @param {ReactNode} props.children - Chart component to render
 * @param {string} props.error - Error message if any
 */
const ChartWrapper = ({ isLoading, error, children }) => {
    return (
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
            ) : error ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flex: 1,
                    }}
                >
                    {error}
                </Box>
            ) : (
                <Box sx={{ height: "100%" }}>{children}</Box>
            )}
        </Paper>
    );
};

/**
 * Container component for dashboard charts
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether data is initially loading
 * @param {boolean} props.isRefreshing - Whether data is being refreshed
 * @param {Array} props.jobs - Jobs data array
 * @param {Array} props.queues - Queues data array
 * @param {Object} props.errors - Component-specific errors
 */
const ChartsContainer = ({
    isLoading,
    isRefreshing = false,
    jobs = [],
    queues = [],
    errors = {},
}) => {
    // Combine loading states
    const showLoader = isLoading || isRefreshing;

    return (
        <Grid container spacing={3} sx={{ flex: 1, minHeight: 0, mb: 3 }}>
            <Grid item xs={12} md={6}>
                <ChartWrapper isLoading={showLoader} error={errors.jobs}>
                    <JobStatusPieChart data={jobs} />
                </ChartWrapper>
            </Grid>

            <Grid item xs={12} md={6}>
                <ChartWrapper isLoading={showLoader} error={errors.queues}>
                    <QueueResourcesBarChart data={queues} />
                </ChartWrapper>
            </Grid>
        </Grid>
    );
};

export default ChartsContainer;
