import { getDashboardConfig } from "./config";

const QUEUE_POD_GROUP_METRICS = {
    volcano_queue_pod_group_inqueue_count: "inqueue",
    volcano_queue_pod_group_pending_count: "pending",
    volcano_queue_pod_group_running_count: "running",
};

const QUEUE_SCHEDULER_METRICS = {
    volcano_queue_allocated_memory_bytes: ["memory", "allocatedBytes"],
    volcano_queue_allocated_milli_cpu: ["cpu", "allocatedMilli"],
    volcano_queue_allocated_scalar_resources: ["scalar", "allocated"],
    volcano_queue_deserved_memory_bytes: ["memory", "deservedBytes"],
    volcano_queue_deserved_milli_cpu: ["cpu", "deservedMilli"],
    volcano_queue_deserved_scalar_resources: ["scalar", "deserved"],
    volcano_queue_overused: ["scheduling", "overused"],
    volcano_queue_request_memory_bytes: ["memory", "requestedBytes"],
    volcano_queue_request_milli_cpu: ["cpu", "requestedMilli"],
    volcano_queue_request_scalar_resources: ["scalar", "requested"],
    volcano_queue_share: ["scheduling", "share"],
    volcano_queue_weight: ["scheduling", "weight"],
};

const SCHEDULER_LATENCY_METRIC =
    "volcano_e2e_scheduling_latency_milliseconds";
const JOB_SCHEDULING_LATENCY_METRIC =
    "volcano_e2e_job_scheduling_latency_milliseconds";
const TASK_SCHEDULING_LATENCY_METRIC =
    "volcano_task_scheduling_latency_milliseconds";
const ACTION_SCHEDULING_LATENCY_METRIC =
    "volcano_action_scheduling_latency_milliseconds";
const PLUGIN_SCHEDULING_LATENCY_METRIC =
    "volcano_plugin_scheduling_latency_milliseconds";

const emptyPodGroupCounts = (source = "unavailable") => ({
    inqueue: 0,
    pending: 0,
    running: 0,
    source,
});

const emptySchedulerMetrics = (source = "unavailable") => ({
    cpu: {
        allocatedMilli: 0,
        deservedMilli: 0,
        requestedMilli: 0,
    },
    memory: {
        allocatedBytes: 0,
        deservedBytes: 0,
        requestedBytes: 0,
    },
    podGroups: {
        completed: 0,
        inqueue: 0,
        pending: 0,
        running: 0,
        unknown: 0,
    },
    scalar: {},
    scheduling: {},
    source,
});

const parseLabels = (rawLabels): Record<string, string> => {
    const labels: Record<string, string> = {};
    const labelPattern = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"/g;
    let match;

    while ((match = labelPattern.exec(rawLabels)) !== null) {
        labels[match[1]] = match[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }

    return labels;
};

const metricLinePattern =
    /^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s|$)/;

const plainMetricLinePattern =
    /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s|$)/;

export const parseQueuePodGroupMetrics = (metricsText) => {
    const counts = new Map();

    for (const line of String(metricsText || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(metricLinePattern);
        if (!match) continue;

        const [, metricName, rawLabels, rawValue] = match;
        const field = QUEUE_POD_GROUP_METRICS[metricName];
        if (!field) continue;

        const labels = parseLabels(rawLabels);
        const queueName = labels.queue_name;
        if (!queueName) continue;

        const value = Number(rawValue);
        if (!Number.isFinite(value)) continue;

        const current =
            counts.get(queueName) || emptyPodGroupCounts("controller-metrics");
        counts.set(queueName, {
            ...current,
            [field]: value,
            source: "controller-metrics",
        });
    }

    return counts;
};

export const parseQueueSchedulerMetrics = (metricsText) => {
    const metrics = new Map();

    for (const line of String(metricsText || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(metricLinePattern);
        if (!match) continue;

        const [, metricName, rawLabels, rawValue] = match;
        const target = QUEUE_SCHEDULER_METRICS[metricName];
        if (!target) continue;

        const labels = parseLabels(rawLabels);
        const queueName = labels.queue_name || labels.queue;
        if (!queueName) continue;

        const value = Number(rawValue);
        if (!Number.isFinite(value)) continue;

        const current =
            metrics.get(queueName) || emptySchedulerMetrics("scheduler-metrics");
        const [section, field] = target;

        if (section === "scalar") {
            const resource = labels.resource || labels.resource_name;
            if (!resource) continue;
            metrics.set(queueName, {
                ...current,
                scalar: {
                    ...current.scalar,
                    [resource]: {
                        ...(current.scalar[resource] || {}),
                        [field]: value,
                    },
                },
                source: "scheduler-metrics",
            });
            continue;
        }

        metrics.set(queueName, {
            ...current,
            [section]: {
                ...current[section],
                [field]: section === "scheduling" && field === "overused"
                    ? value === 1
                    : value,
            },
            source: "scheduler-metrics",
        });
    }

    return metrics;
};

export const emptySchedulerMetricsSummary = (source = "unavailable") => ({
    scheduling: {
        actionLatency: [],
        avgLatencyMs: null,
        latency: {
            e2eAvgMs: null,
            jobAvgMs: null,
            taskAvgMs: null,
        },
        latencyBuckets: {
            e2e: [],
        },
        pluginLatency: [],
        preemption: {
            attempts: 0,
            victims: 0,
        },
        samples: 0,
        source,
        unschedulable: {
            jobs: 0,
            tasks: 0,
            topTasks: [],
        },
    },
});

const average = ({ count, sum }) => (count ? sum / count : null);

const parseBucketUpperBound = (le) => {
    if (le === "+Inf") return null;
    const parsed = Number(le);
    return Number.isFinite(parsed) ? parsed : null;
};

const buildBucketRows = (buckets, totalCount) => {
    const sorted = [...buckets.entries()].sort(([left], [right]) => {
        const leftBound = parseBucketUpperBound(left);
        const rightBound = parseBucketUpperBound(right);
        if (leftBound === null && rightBound === null) return 0;
        if (leftBound === null) return 1;
        if (rightBound === null) return -1;
        return leftBound - rightBound;
    });
    const total =
        totalCount || sorted[sorted.length - 1]?.[1]?.cumulativeCount || 0;
    let previous = 0;

    return sorted.map(([le, item]) => {
        const bucketCount = Math.max(item.cumulativeCount - previous, 0);
        previous = item.cumulativeCount;

        return {
            bucketCount,
            cumulativeCount: item.cumulativeCount,
            le,
            percent: total ? (bucketCount / total) * 100 : 0,
            upperBoundMs: parseBucketUpperBound(le),
        };
    });
};

const sortedTop = (items, valueKey = "avgMs", limit = 5) =>
    [...items]
        .filter(
            (item) =>
                item[valueKey] !== null &&
                item[valueKey] !== undefined &&
                Number.isFinite(Number(item[valueKey])),
        )
        .sort((left, right) => Number(right[valueKey]) - Number(left[valueKey]))
        .slice(0, limit);

export const parseSchedulerMetricsSummary = (metricsText) => {
    const e2e = { count: 0, sum: 0 };
    const job = { count: 0, sum: 0 };
    const task = { count: 0, sum: 0 };
    const actionLatency = new Map();
    const e2eBuckets = new Map();
    const pluginLatency = new Map();
    let unschedulableJobs = 0;
    const unschedulableTasks = new Map();
    let preemptionAttempts = 0;
    let preemptionVictims = 0;

    for (const line of String(metricsText || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(plainMetricLinePattern);
        if (!match) continue;

        const [, metricName, rawLabels = "", rawValue] = match;
        const value = Number(rawValue);
        if (!Number.isFinite(value)) continue;
        const labels = parseLabels(rawLabels);

        const assignHistogram = (baseMetric, target) => {
            if (metricName === `${baseMetric}_sum`) {
                target.sum = value;
                return true;
            }
            if (metricName === `${baseMetric}_count`) {
                target.count = value;
                return true;
            }
            return false;
        };

        if (assignHistogram(SCHEDULER_LATENCY_METRIC, e2e)) continue;
        if (assignHistogram(JOB_SCHEDULING_LATENCY_METRIC, job)) continue;
        if (assignHistogram(TASK_SCHEDULING_LATENCY_METRIC, task)) continue;

        if (metricName === `${SCHEDULER_LATENCY_METRIC}_bucket`) {
            const le = labels.le;
            if (!le) continue;
            e2eBuckets.set(le, {
                cumulativeCount: value,
                le,
            });
            continue;
        }

        if (
            metricName === `${ACTION_SCHEDULING_LATENCY_METRIC}_sum` ||
            metricName === `${ACTION_SCHEDULING_LATENCY_METRIC}_count`
        ) {
            const action = labels.action;
            if (!action) continue;
            const current = actionLatency.get(action) || {
                action,
                count: 0,
                sum: 0,
            };
            if (metricName.endsWith("_sum")) current.sum = value;
            else current.count = value;
            actionLatency.set(action, current);
            continue;
        }

        if (
            metricName === `${PLUGIN_SCHEDULING_LATENCY_METRIC}_sum` ||
            metricName === `${PLUGIN_SCHEDULING_LATENCY_METRIC}_count`
        ) {
            const plugin = labels.plugin;
            const onSession = labels.OnSession;
            if (!plugin || !onSession) continue;
            const key = `${plugin}\0${onSession}`;
            const current = pluginLatency.get(key) || {
                count: 0,
                onSession,
                plugin,
                sum: 0,
            };
            if (metricName.endsWith("_sum")) current.sum = value;
            else current.count = value;
            pluginLatency.set(key, current);
            continue;
        }

        if (metricName === "volcano_unschedule_job_count") {
            unschedulableJobs = value;
            continue;
        }

        if (metricName === "volcano_unschedule_task_count") {
            const jobId = labels.job_id;
            if (!jobId) continue;
            unschedulableTasks.set(jobId, value);
            continue;
        }

        if (metricName === "volcano_pod_preemption_victims") {
            preemptionVictims = value;
            continue;
        }

        if (metricName === "volcano_total_preemption_attempts") {
            preemptionAttempts = value;
        }
    }

    const e2eAvgMs = average(e2e);
    const jobAvgMs = average(job);
    const taskAvgMs = average(task);
    const latencyBuckets = {
        e2e: buildBucketRows(e2eBuckets, e2e.count),
    };
    const actionRows = sortedTop(
        [...actionLatency.values()].map((item) => ({
            action: item.action,
            avgMs: average(item),
            count: item.count,
        })),
    );
    const pluginRows = sortedTop(
        [...pluginLatency.values()].map((item) => ({
            avgMs: average(item),
            count: item.count,
            onSession: item.onSession,
            plugin: item.plugin,
        })),
    );
    const topTasks = sortedTop(
        [...unschedulableTasks.entries()].map(([jobId, tasks]) => ({
            jobId,
            tasks,
        })),
        "tasks",
    );
    const tasks = [...unschedulableTasks.values()].reduce(
        (sum, value) => sum + value,
        0,
    );

    if (
        e2eAvgMs === null &&
        jobAvgMs === null &&
        taskAvgMs === null &&
        !latencyBuckets.e2e.length &&
        !actionRows.length &&
        !pluginRows.length &&
        !unschedulableJobs &&
        !tasks &&
        !preemptionVictims &&
        !preemptionAttempts
    ) {
        return emptySchedulerMetricsSummary();
    }

    return {
        scheduling: {
            actionLatency: actionRows,
            avgLatencyMs: e2eAvgMs,
            latency: {
                e2eAvgMs,
                jobAvgMs,
                taskAvgMs,
            },
            latencyBuckets,
            pluginLatency: pluginRows,
            preemption: {
                attempts: preemptionAttempts,
                victims: preemptionVictims,
            },
            samples: e2e.count,
            source: "scheduler-metrics",
            unschedulable: {
                jobs: unschedulableJobs,
                tasks,
                topTasks,
            },
        },
    };
};

export const getQueuePodGroupCounts = (counts, queueName) => {
    const value = counts?.get?.(queueName);
    return value || emptyPodGroupCounts();
};

export const getQueueSchedulerMetrics = (metrics, queueName) => {
    const value = metrics?.get?.(queueName);
    return value || emptySchedulerMetrics();
};

export const mergeQueueMetrics = (schedulerMetrics, podGroupCounts) => ({
    ...schedulerMetrics,
    podGroups: {
        ...emptySchedulerMetrics().podGroups,
        ...(podGroupCounts || {}),
    },
});

export const fetchQueuePodGroupMetrics = async () => {
    const config = await getDashboardConfig();
    const endpoint = config.schedulerConfig?.ControllersMetricEndpoint;

    if (!endpoint) {
        return {
            counts: new Map(),
            source: "unavailable",
        };
    }

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Metrics endpoint returned ${response.status}`);
        }

        return {
            counts: parseQueuePodGroupMetrics(await response.text()),
            source: "controller-metrics",
        };
    } catch (error) {
        console.warn(
            `[queue-metrics] failed to fetch controller metrics: ${
                error?.message || error
            }`,
        );
        return {
            counts: new Map(),
            source: "unavailable",
        };
    }
};

export const fetchQueueSchedulerMetrics = async () => {
    const config = await getDashboardConfig();
    const endpoint = config.schedulerConfig?.SchedulerMetricEndpoint;

    if (!endpoint) {
        return {
            metrics: new Map(),
            source: "unavailable",
        };
    }

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Metrics endpoint returned ${response.status}`);
        }

        return {
            metrics: parseQueueSchedulerMetrics(await response.text()),
            source: "scheduler-metrics",
        };
    } catch (error) {
        console.warn(
            `[queue-metrics] failed to fetch scheduler metrics: ${
                error?.message || error
            }`,
        );
        return {
            metrics: new Map(),
            source: "unavailable",
        };
    }
};

export const fetchSchedulerMetricsSummary = async () => {
    const config = await getDashboardConfig();
    const endpoint = config.schedulerConfig?.SchedulerMetricEndpoint;

    if (!endpoint) return emptySchedulerMetricsSummary();

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Metrics endpoint returned ${response.status}`);
        }

        return parseSchedulerMetricsSummary(await response.text());
    } catch (error) {
        console.warn(
            `[scheduler-metrics] failed to fetch scheduler metrics: ${
                error?.message || error
            }`,
        );
        return emptySchedulerMetricsSummary();
    }
};
