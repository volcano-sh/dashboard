import { getDashboardConfig } from "./config";

const QUEUE_POD_GROUP_METRICS = {
    volcano_queue_pod_group_inqueue_count: "inqueue",
    volcano_queue_pod_group_pending_count: "pending",
    volcano_queue_pod_group_running_count: "running",
};

const emptyPodGroupCounts = (source = "unavailable") => ({
    inqueue: 0,
    pending: 0,
    running: 0,
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

export const parseQueuePodGroupMetrics = (metricsText) => {
    const counts = new Map();
    const linePattern =
        /^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s|$)/;

    for (const line of String(metricsText || "").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const match = trimmed.match(linePattern);
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

export const getQueuePodGroupCounts = (counts, queueName) => {
    const value = counts?.get?.(queueName);
    return value || emptyPodGroupCounts();
};

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
