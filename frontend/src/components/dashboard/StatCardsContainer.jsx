import React from "react";
import { Grid, Skeleton } from "@mui/material";
import StatCard from "../Charts/StatCard";
import { calculateSuccessRate } from "./utils";

/**
 * Container component for displaying multiple StatCards
 *
 * @param {Object} props - Component props
 * @param {Array} props.jobs - Jobs data array
 * @param {Array} props.queues - Queues data array
 * @param {Array} props.pods - Pods data array
 * @param {boolean} props.isLoading - Whether data is initially loading
 * @param {boolean} props.isRefreshing - Whether data is being refreshed
 */
const StatCardsContainer = ({
    jobs = [],
    queues = [],
    pods = [],
    isLoading = false,
    isRefreshing = false,
}) => {
    const activeQueues =
        queues.filter((q) => q.status?.state === "Open").length || 0;
    const runningPods =
        pods.filter((p) => p.status?.phase === "Running").length || 0;
    const successRate = calculateSuccessRate(jobs);

    const showLoader = isLoading || isRefreshing;
    const loaderVariant = isLoading ? "wave" : "pulse";

    return (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Total Jobs"
                    value={jobs?.length || 0}
                    isLoading={showLoader}
                    animationVariant={loaderVariant}
                    icon="WorkOutline"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Active Queues"
                    value={activeQueues}
                    isLoading={showLoader}
                    animationVariant={loaderVariant}
                    icon="QueuePlay"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Running Pods"
                    value={runningPods}
                    isLoading={showLoader}
                    animationVariant={loaderVariant}
                    icon="Memory"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Complete Rate"
                    value={`${successRate}%`}
                    isLoading={showLoader}
                    animationVariant={loaderVariant}
                    icon="CheckCircleOutline"
                />
            </Grid>
        </Grid>
    );
};

export default StatCardsContainer;
