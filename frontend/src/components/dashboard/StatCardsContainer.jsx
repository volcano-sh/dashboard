import React from "react";
import { Grid } from "@mui/material";
import StatCard from "../Charts/StatCard";
import { calculateSuccessRate } from "./utils";
import { useI18n } from "../../context/I18nContext";

const StatCardsContainer = ({ jobs, queues, pods }) => {
    const { t } = useI18n();
    const activeQueues =
        queues.filter((q) => q.status?.state === "Open").length || 0;
    const runningPods =
        pods.filter((p) => p.status?.phase === "Running").length || 0;
    const successRate = calculateSuccessRate(jobs);

    return (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t("dashboard.totalJobs")}
                    value={jobs?.length || 0}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t("dashboard.activeQueues", "Active Queues")}
                    value={activeQueues}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t("dashboard.runningPods", "Running Pods")}
                    value={runningPods}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title={t("dashboard.completeRate", "Complete Rate")}
                    value={`${successRate}%`}
                />
            </Grid>
        </Grid>
    );
};

export default StatCardsContainer;
