import { useMemo } from "react";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuery } from "@tanstack/react-query";
import {
    fetchJobs,
    fetchPods,
    fetchQueueList,
    fetchSchedulerMetrics,
    getApiErrorMessage,
} from "../../lib/client/dashboard-api";
import OverviewMetricGrid from "../overview/OverviewMetricGrid";
import { OverviewPanel } from "../overview/OverviewPanel";
import PodStatusDistribution from "../overview/PodStatusDistribution";
import QueueHealthSummary from "../overview/QueueHealthSummary";
import QueueStatusSummary from "../overview/QueueStatusSummary";
import SchedulingLatencyDistribution from "../overview/SchedulingLatencyDistribution";
import SchedulerMetricsSnapshot from "../overview/SchedulerMetricsSnapshot";
import SchedulerResourceAllocation from "../overview/SchedulerResourceAllocation";
import {
    buildClusterSummary,
    buildMetricCards,
    buildPodDistribution,
    buildQueueHealth,
    buildQueueRows,
} from "../overview/overviewUtils";

export default function Dashboard() {
    const {
        data: jobsData,
        error: jobsError,
        isFetching: jobsFetching,
        refetch: refetchJobs,
    } = useQuery({
        queryKey: ["dashboard", "jobs"],
        queryFn: () => fetchJobs({ limit: 1000 }),
    });
    const {
        data: queuesData,
        error: queuesError,
        isFetching: queuesFetching,
        refetch: refetchQueues,
    } = useQuery({
        queryKey: ["dashboard", "queues"],
        queryFn: () => fetchQueueList({ limit: 1000 }),
    });
    const {
        data: podsData,
        error: podsError,
        isFetching: podsFetching,
        refetch: refetchPods,
    } = useQuery({
        queryKey: ["dashboard", "pods"],
        queryFn: () => fetchPods({ limit: 1000 }),
    });
    const {
        data: schedulerMetricsData,
        error: schedulerMetricsError,
        isFetching: schedulerMetricsFetching,
        refetch: refetchSchedulerMetrics,
    } = useQuery({
        queryKey: ["dashboard", "scheduler", "metrics"],
        queryFn: fetchSchedulerMetrics,
    });

    const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
    const queues = useMemo(() => queuesData?.items || [], [queuesData]);
    const pods = useMemo(() => podsData?.items || [], [podsData]);
    const loading =
        jobsFetching || queuesFetching || podsFetching || schedulerMetricsFetching;
    const error = jobsError || queuesError || podsError || schedulerMetricsError;

    const queueRows = useMemo(() => buildQueueRows(queues), [queues]);
    const summary = useMemo(
        () => buildClusterSummary({ jobs, pods, queues }),
        [jobs, pods, queues],
    );
    const schedulerSummary = useMemo(
        () =>
            schedulerMetricsData?.scheduling || {
                avgLatencyMs: null,
                latencyBuckets: { e2e: [] },
                samples: 0,
                source: "unavailable",
            },
        [schedulerMetricsData],
    );
    const podDistribution = useMemo(() => buildPodDistribution(pods), [pods]);
    const queueHealth = useMemo(() => buildQueueHealth(queues), [queues]);
    const metrics = useMemo(
        () => buildMetricCards({ queues, schedulerSummary, summary }),
        [queues, schedulerSummary, summary],
    );

    const handleRefresh = () => {
        refetchJobs();
        refetchQueues();
        refetchPods();
        refetchSchedulerMetrics();
    };

    return (
        <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", p: 3 }}>
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
                    Cluster Overview
                </Typography>
                <Stack direction="row" spacing={1.25}>
                    <Button
                        disabled={loading}
                        onClick={handleRefresh}
                        startIcon={<RefreshIcon sx={{ fontSize: 17 }} />}
                        sx={{ textTransform: "none" }}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                </Stack>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && (
                <OverviewPanel sx={{ borderColor: "#f3b7b7", mb: 2 }}>
                    <Typography color="error" sx={{ fontSize: 13 }}>
                        {getApiErrorMessage(error, "Failed to load overview")}
                    </Typography>
                </OverviewPanel>
            )}

            <OverviewMetricGrid metrics={metrics} />

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1.25fr 1.35fr" },
                    mb: 2,
                }}
            >
                <PodStatusDistribution segments={podDistribution} />
                <QueueHealthSummary items={queueHealth} />
                <SchedulingLatencyDistribution
                    buckets={schedulerSummary.latencyBuckets?.e2e || []}
                />
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", xl: "1.75fr 1fr" },
                    mb: 2,
                }}
            >
                <Box sx={{ overflowX: "auto" }}>
                    <SchedulerResourceAllocation rows={queueRows} />
                </Box>
                <QueueStatusSummary items={queueHealth} />
            </Box>

            <SchedulerMetricsSnapshot metrics={schedulerSummary} />
        </Box>
    );
}
