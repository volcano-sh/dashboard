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

const parseLabels = (rawLabels) => {
    const labels = {};
    const labelPattern = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"/g;
    let match;

    while ((match = labelPattern.exec(rawLabels)) !== null) {
        labels[match[1]] = match[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }

    return labels;
};

const metricLinePattern =
    /^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s|$)/;

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
