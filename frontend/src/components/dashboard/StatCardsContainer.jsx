import React from "react";
import { Grid } from "@mui/material";
import StatCard from "../Charts/StatCard";
import { calculateSuccessRate } from "./utils";
import {useTranslation} from "react-i18next"

const StatCardsContainer = ({ jobs, queues, pods }) => {

    const { t } = useTranslation();

    const activeQueues =
        queues.filter((q) => q.status?.state === "Open").length || 0;
    const runningPods =
        pods.filter((p) => p.status?.phase === "Running").length || 0;
    const successRate = calculateSuccessRate(jobs);

    return (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard title={t("dashboard.stats.totalJobs")} value={jobs?.length || 0} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard title={t("dashboard.stats.activeQueues")} value={activeQueues} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard title={t("dashboard.stats.runningPods")} value={runningPods} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard title={t("dashboard.stats.completeRate")} value={`${successRate}%`} />
            </Grid>
        </Grid>
    );
};

export default StatCardsContainer;
