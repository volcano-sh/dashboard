const parseResourceNumber = (value) => {
    const parsed = Number.parseFloat(
        String(value || "0").replace(/[^\d.]/g, ""),
    );
    return Number.isFinite(parsed) ? parsed : 0;
};

const resourceValue = (obj, section, resource) =>
    obj?.status?.[section]?.[resource] ||
    obj?.spec?.[section]?.resource?.[resource] ||
    obj?.spec?.[section]?.[resource] ||
    "0";

const resourceSummary = (obj) => ({
    allocated: obj?.status?.allocated || {},
    pending: obj?.status?.pending || obj?.status?.inqueue || {},
    guarantee: obj?.spec?.guarantee?.resource || obj?.spec?.guarantee || {},
    deserved: obj?.spec?.deserved?.resource || obj?.spec?.deserved || {},
    capability: obj?.spec?.capability?.resource || obj?.spec?.capability || {},
});

const queueUsage = (queue, resource) => {
    const allocated = parseResourceNumber(
        resourceValue(queue, "allocated", resource),
    );
    const capability = parseResourceNumber(
        resourceValue(queue, "capability", resource),
    );
    if (!capability) return 0;
    return Math.min(Math.round((allocated / capability) * 100), 100);
};

export const jobPhase = (job) =>
    job?.status?.state?.phase ||
    job?.status?.phase ||
    job?.status?.state ||
    "Unknown";

export const withJobSummary = (job) => ({
    ...job,
    summary: {
        name: job?.metadata?.name || "",
        namespace: job?.metadata?.namespace || "default",
        queue: job?.spec?.queue || "",
        status: jobPhase(job),
        createdAt: job?.metadata?.creationTimestamp || "",
        minAvailable: job?.spec?.minAvailable,
        tasks: job?.spec?.tasks || [],
    },
});

const cronJobQueue = (cronJob) =>
    cronJob?.metadata?.annotations?.["scheduling.volcano.sh/queue-name"] ||
    cronJob?.metadata?.labels?.queue ||
    cronJob?.metadata?.labels?.["volcano.sh/queue"] ||
    cronJob?.spec?.queue ||
    cronJob?.spec?.jobTemplate?.spec?.queue ||
    cronJob?.spec?.jobTemplate?.spec?.template?.metadata?.annotations?.[
        "scheduling.volcano.sh/queue-name"
    ] ||
    cronJob?.spec?.jobTemplate?.spec?.template?.metadata?.labels?.queue ||
    "";

const cronJobActiveCount = (cronJob) => {
    const active = cronJob?.status?.active;
    if (Array.isArray(active)) return active.length;
    return Number(active || 0);
};

export const cronJobStatus = (cronJob) => {
    if (cronJob?.spec?.suspend) return "Suspended";
    if (cronJobActiveCount(cronJob) > 0) return "Active";
    return "Scheduled";
};

export const withCronJobSummary = (cronJob) => ({
    ...cronJob,
    summary: {
        name: cronJob?.metadata?.name || "",
        namespace: cronJob?.metadata?.namespace || "default",
        queue: cronJobQueue(cronJob),
        status: cronJobStatus(cronJob),
        schedule: cronJob?.spec?.schedule || "",
        concurrencyPolicy: cronJob?.spec?.concurrencyPolicy || "Allow",
        suspend: Boolean(cronJob?.spec?.suspend),
        active: cronJobActiveCount(cronJob),
        lastScheduleTime: cronJob?.status?.lastScheduleTime || "",
        lastSuccessfulTime: cronJob?.status?.lastSuccessfulTime || "",
        createdAt: cronJob?.metadata?.creationTimestamp || "",
    },
});

export const withPodGroupSummary = (podGroup) => ({
    ...podGroup,
    summary: {
        name: podGroup?.metadata?.name || "",
        namespace: podGroup?.metadata?.namespace || "default",
        queue: podGroup?.spec?.queue || "",
        status: podGroup?.status?.phase || "Unknown",
        createdAt: podGroup?.metadata?.creationTimestamp || "",
        minMember: podGroup?.spec?.minMember,
        running: podGroup?.status?.running || 0,
        succeeded: podGroup?.status?.succeeded || 0,
        failed: podGroup?.status?.failed || 0,
    },
});

const defaultSchedulerMetrics = {
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
    source: "unavailable",
};

export const withQueueSummary = (
    queue,
    schedulerMetrics = defaultSchedulerMetrics,
) => {
    const pendingCpu = parseResourceNumber(
        resourceValue(queue, "pending", "cpu") ||
            resourceValue(queue, "inqueue", "cpu"),
    );
    const cpuUsage = queueUsage(queue, "cpu");
    const memoryUsage = queueUsage(queue, "memory");
    const health =
        cpuUsage >= 80 || memoryUsage >= 80
            ? "Hot"
            : pendingCpu > 0 && cpuUsage < 35
              ? "Starving"
              : queue?.spec?.parent && pendingCpu > 0
                ? "Blocked"
                : cpuUsage < 15 && memoryUsage < 15
                  ? "Idle"
                  : "Healthy";

    return {
        ...queue,
        summary: {
            name: queue?.metadata?.name || "",
            namespace: "",
            parent: queue?.spec?.parent || "root",
            status:
                queue?.status?.state === "Open"
                    ? "Active"
                    : queue?.status?.state || "Unknown",
            createdAt: queue?.metadata?.creationTimestamp || "",
            weight: queue?.spec?.weight,
            reclaimable: queue?.spec?.reclaimable,
            resources: resourceSummary(queue),
            usage: {
                cpu: cpuUsage,
                memory: memoryUsage,
                gpu: queueUsage(queue, "nvidia.com/gpu"),
            },
            pending: {
                cpu: pendingCpu,
            },
            schedulerMetrics: {
                ...defaultSchedulerMetrics,
                ...schedulerMetrics,
            },
            health,
        },
    };
};

export const withPodSummary = (pod) => ({
    ...pod,
    summary: {
        name: pod?.metadata?.name || "",
        namespace: pod?.metadata?.namespace || "default",
        status: pod?.status?.phase || "Unknown",
        queue:
            pod?.metadata?.annotations?.["scheduling.volcano.sh/queue-name"] ||
            pod?.metadata?.labels?.queue ||
            "",
        nodeName: pod?.spec?.nodeName || "",
        createdAt: pod?.metadata?.creationTimestamp || "",
        containers: pod?.spec?.containers?.length || 0,
        restarts:
            pod?.status?.containerStatuses?.reduce(
                (total, status) => total + (status.restartCount || 0),
                0,
            ) || 0,
    },
});

export const withNamespaceSummary = (namespace) => ({
    ...namespace,
    summary: {
        name: namespace?.metadata?.name || "",
        status: namespace?.status?.phase || "Unknown",
        createdAt: namespace?.metadata?.creationTimestamp || "",
    },
});
