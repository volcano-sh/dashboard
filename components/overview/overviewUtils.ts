import {
    formatShare,
    getQueueResourceStatusItems,
    getQueueUsageSummary,
} from "../queues/queueResourceUsage";
import { numberFormat } from "./overviewStyles";

export const getJobPhase = (job) =>
    job?.summary?.status ||
    job?.status?.state?.phase ||
    job?.status?.phase ||
    job?.status?.state ||
    "";

const getQueueName = (queue) =>
    queue?.summary?.name || queue?.metadata?.name || queue?.name || "-";

export const isActiveQueue = (queue) => {
    const state =
        queue?.summary?.status ||
        queue?.status?.state ||
        queue?.status?.phase ||
        "";
    return state === "Open" || state === "Active";
};

const getPodGroupCounts = (queue) => ({
    inqueue: Number(queue?.summary?.schedulerMetrics?.podGroups?.inqueue ?? 0),
    pending: Number(queue?.summary?.schedulerMetrics?.podGroups?.pending ?? 0),
    running: Number(queue?.summary?.schedulerMetrics?.podGroups?.running ?? 0),
});

const getAllocatedCoreResources = (queue) => ({
    cpu: Number(queue?.summary?.schedulerMetrics?.cpu?.allocatedMilli ?? 0),
    memory: Number(queue?.summary?.schedulerMetrics?.memory?.allocatedBytes ?? 0),
});

const getRequestedCoreResources = (queue) => ({
    cpu: Number(queue?.summary?.schedulerMetrics?.cpu?.requestedMilli ?? 0),
    memory: Number(queue?.summary?.schedulerMetrics?.memory?.requestedBytes ?? 0),
});

export const classifyQueue = (queue) => {
    const counts = getPodGroupCounts(queue);
    const pendingWorkload = counts.pending + counts.inqueue;
    const allocated = getAllocatedCoreResources(queue);
    const requested = getRequestedCoreResources(queue);
    const overused = queue?.summary?.schedulerMetrics?.scheduling?.overused;

    if (overused) return "Overused";
    if (!counts.running && !pendingWorkload) return "Idle";
    if (pendingWorkload && !allocated.cpu && !allocated.memory) return "Starving";
    if (counts.running && pendingWorkload) return "Busy";
    if (
        (requested.cpu || requested.memory) &&
        (allocated.cpu / Math.max(requested.cpu, 1) < 0.5 ||
            allocated.memory / Math.max(requested.memory, 1) < 0.5)
    ) {
        return "Underused";
    }
    return "Healthy";
};

export const formatLatency = (value) => {
    if (value === undefined || value === null || !Number.isFinite(Number(value))) {
        return "-";
    }
    const numeric = Number(value);
    if (numeric >= 1000) {
        return `${Number((numeric / 1000).toFixed(2)).toString()} s`;
    }
    return `${Number(numeric.toFixed(1)).toString()} ms`;
};

export const pct = (value, total) =>
    total ? Math.round((value / total) * 1000) / 10 : 0;

export const buildQueueRows = (queues) =>
    queues
        .map((queue) => {
            const usage = getQueueUsageSummary(queue);
            const health = classifyQueue(queue);
            const scheduling = queue?.summary?.schedulerMetrics?.scheduling || {};

            return {
                health,
                name: getQueueName(queue),
                resources: getQueueResourceStatusItems(queue),
                share: formatShare(scheduling.share),
                usagePercent: usage.usagePercent,
                weight: scheduling.weight ?? queue?.spec?.weight ?? "-",
            };
        })
        .sort((left, right) => right.usagePercent - left.usagePercent)
        .slice(0, 5);

export const buildClusterSummary = ({ jobs, pods, queues }) => ({
    activeQueues: queues.filter(isActiveQueue).length,
    pendingJobs: jobs.filter((job) => getJobPhase(job) === "Pending").length,
    runningJobs: jobs.filter((job) => getJobPhase(job) === "Running").length,
    runningPods: pods.filter(
        (pod) => (pod?.summary?.status || pod?.status?.phase) === "Running",
    ).length,
    totalJobs: jobs.length,
});

export const buildPodDistribution = (pods) => {
    const counts = pods.reduce(
        (acc, pod) => {
            const phase = pod?.summary?.status || pod?.status?.phase || "Pending";
            if (phase === "Running") acc.Running += 1;
            else if (["Succeeded", "Completed"].includes(phase))
                acc.Succeeded += 1;
            else if (phase === "Failed") acc.Failed += 1;
            else acc.Pending += 1;
            return acc;
        },
        { Failed: 0, Pending: 0, Running: 0, Succeeded: 0 },
    );

    return [
        { color: "#1f5fae", label: "Running", value: counts.Running },
        { color: "#f59e0b", label: "Pending", value: counts.Pending },
        { color: "#7cc991", label: "Succeeded", value: counts.Succeeded },
        { color: "#ef3333", label: "Failed", value: counts.Failed },
    ];
};

export const buildQueueHealth = (queues) => {
    const queueHealth = queues.map(classifyQueue);
    const total = queueHealth.length || 1;
    const count = (status) =>
        queueHealth.filter((queueStatus) => queueStatus === status).length;
    const healthy = queueHealth.filter((queueStatus) =>
        ["Healthy", "Idle"].includes(queueStatus),
    ).length;
    const degraded = queueHealth.filter((queueStatus) =>
        ["Busy", "Underused"].includes(queueStatus),
    ).length;
    const starving = count("Starving");
    const overused = count("Overused");

    return [
        {
            color: "#22b34b",
            label: "Healthy",
            percent: pct(healthy, total),
            value: healthy,
        },
        {
            color: "#f59e0b",
            label: "Degraded",
            percent: pct(degraded, total),
            value: degraded,
        },
        {
            color: "#ef3333",
            label: "Overused",
            percent: pct(overused, total),
            value: overused,
        },
        {
            color: "#fbbf24",
            label: "Starving",
            percent: pct(starving, total),
            value: starving,
        },
    ];
};

export const buildCurrentSignals = (queueRows, schedulerSummary: any = {}) => {
    const unschedulable = schedulerSummary.unschedulable || {};
    const preemption = schedulerSummary.preemption || {};
    const schedulerSignals = [
        Number(unschedulable.jobs || 0) > 0 && {
            message: `${unschedulable.jobs} unschedulable jobs reported by scheduler metrics`,
            severity: "Warning",
        },
        Number(unschedulable.tasks || 0) > 0 && {
            message: `${unschedulable.tasks} unschedulable tasks reported by scheduler metrics`,
            severity: "Warning",
        },
        Number(preemption.victims || 0) > 0 && {
            message: `${preemption.victims} preemption victims currently selected`,
            severity: "Warning",
        },
    ].filter(Boolean);
    const queueSignals = queueRows
        .filter((queue) =>
            ["Overused", "Busy", "Starving", "Underused"].includes(queue.health),
        )
        .slice(0, 4)
        .map((queue) => ({
            message:
                queue.health === "Overused"
                    ? `Queue ${queue.name} is overused by scheduler fairness metrics`
                : queue.health === "Busy"
                  ? `Queue ${queue.name} has running and pending PodGroups`
                : queue.health === "Starving"
                  ? `Queue ${queue.name} has pending PodGroups without allocation`
                  : `Queue ${queue.name} has requested resources with low allocation`,
            severity: queue.health,
        }));
    const generated = [...schedulerSignals, ...queueSignals].slice(0, 4);

    return generated.length
        ? generated
        : [
              {
                  message: "Cluster queues are currently healthy",
                  severity: "Info",
              },
          ];
};

export const buildMetricCards = ({ queues, schedulerSummary, summary }) => [
    {
        detail: "from Kubernetes API",
        iconKey: "totalJobs",
        title: "Total Jobs",
        tooltip:
            "Total Volcano Jobs returned by GET /api/v1/jobs. This is a live list count from the Kubernetes API.",
        trend: "live cluster data",
        value: numberFormat.format(summary.totalJobs),
    },
    {
        iconKey: "runningJobs",
        title: "Running Jobs",
        tooltip:
            "Volcano Jobs whose summarized phase is Running. Source: GET /api/v1/jobs.",
        trend: "current state",
        value: numberFormat.format(summary.runningJobs),
    },
    {
        iconKey: "pendingJobs",
        title: "Pending Jobs",
        tooltip:
            "Volcano Jobs whose summarized phase is Pending. Source: GET /api/v1/jobs.",
        trend: "current state",
        value: numberFormat.format(summary.pendingJobs),
    },
    {
        iconKey: "activeQueues",
        title: "Active Queues",
        tooltip:
            "Queues with state Open or Active divided by all queues returned by GET /api/v1/queues.",
        trend: `of ${numberFormat.format(queues.length)} total`,
        value: numberFormat.format(summary.activeQueues),
    },
    {
        iconKey: "runningPods",
        title: "Running Pods",
        tooltip:
            "Pods whose Kubernetes phase is Running. Source: GET /api/v1/pods.",
        trend: "current state",
        value: numberFormat.format(summary.runningPods),
    },
    {
        iconKey: "avgLatency",
        title: "Avg Scheduling Latency",
        tooltip:
            "Cumulative average from SchedulerMetricEndpoint using volcano_e2e_scheduling_latency_milliseconds_sum / count. This is not a time-window average.",
        trend:
            schedulerSummary.source === "scheduler-metrics"
                ? "from SchedulerMetricEndpoint"
                : "metrics unavailable",
        value: formatLatency(schedulerSummary.avgLatencyMs),
    },
];
