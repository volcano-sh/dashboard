
import { procedure, router } from "../../trpc";
import { k8sApi, k8sCoreApi } from "../../utils/k8s";

const getNormalizedJobStatus = (job: any) => {
    const state = job.status?.state?.phase || job.status?.state || "Unknown";
    return state;
};

const getNormalizedPodStatus = (pod: any) => {
    return pod.status?.phase || "Unknown";
};

const getResourceHealthSummary = (resources: Array<{ status?: string | null }> = []) => {
    const counts = { healthy: 0, warning: 0, critical: 0 };

    resources.forEach((resource) => {
        const status = String(resource.status ?? "unknown").trim().toLowerCase();
        let severity: "healthy" | "warning" | "critical" = "warning";

        if (status.includes("fail") || status.includes("error") || status.includes("terminate") || status.includes("crash") || status.includes("evict")) {
            severity = "critical";
        } else if (status.includes("running") || status.includes("complete") || status.includes("succeed") || status.includes("ready") || status.includes("active")) {
            severity = "healthy";
        } else if (status.includes("pending") || status.includes("waiting") || status.includes("queue") || status.includes("inqueue") || status.includes("unknown")) {
            severity = "warning";
        }

        counts[severity] += 1;
    });

    const total = resources.length;
    const score = total === 0 ? 100 : Math.round((counts.healthy / total) * 100);
    let severity: "healthy" | "warning" | "critical" = "healthy";
    if (counts.critical > 0) {
        severity = "critical";
    } else if (counts.warning > 0) {
        severity = "warning";
    }

    return {
        total,
        healthy: counts.healthy,
        warning: counts.warning,
        critical: counts.critical,
        score,
        severity,
        label: severity === "critical" ? "Critical" : severity === "warning" ? "Warning" : "Healthy",
        warningCount: counts.warning,
        failureCount: counts.critical,
    };
};

// Helper function to get summary statistics
const getSummary = async () => {
    try {
        const jobsResponse = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
        });
        const jobs = jobsResponse.items || [];

        const podsResponse = await k8sCoreApi.listPodForAllNamespaces();
        const pods = podsResponse.items || [];

        const totalJobs = jobs.length;
        const activeJobs = jobs.filter((job: any) => {
            const state = getNormalizedJobStatus(job);
            return ["Running", "Pending", "Inqueue"].includes(state);
        }).length;

        const runningPods = pods.filter((pod: any) =>
            getNormalizedPodStatus(pod) === "Running"
        ).length;

        const jobHealth = getResourceHealthSummary(
            jobs.map((job: any) => ({ status: getNormalizedJobStatus(job) }))
        );
        const podHealth = getResourceHealthSummary(
            pods.map((pod: any) => ({ status: getNormalizedPodStatus(pod) }))
        );

        const completeRate = totalJobs > 0
            ? `${Math.round(((totalJobs - activeJobs) / totalJobs) * 100)}%`
            : "0%";

        return {
            totalJobs,
            activeJobs,
            runningPods,
            completeRate,
            warningJobs: jobHealth.warningCount,
            failedJobs: jobHealth.failureCount,
            warningPods: podHealth.warningCount,
            failedPods: podHealth.failureCount,
            jobHealth,
            podHealth,
            jobHealthStatus: jobHealth.label,
            podHealthStatus: podHealth.label,
        };
    } catch (error) {
        console.error("Error fetching summary:", error);
        return {
            totalJobs: 0,
            activeJobs: 0,
            runningPods: 0,
            completeRate: "0%",
            warningJobs: 0,
            failedJobs: 0,
            warningPods: 0,
            failedPods: 0,
            jobHealth: { total: 0, healthy: 0, warning: 0, critical: 0, score: 100, severity: "healthy", label: "Healthy", warningCount: 0, failureCount: 0 },
            podHealth: { total: 0, healthy: 0, warning: 0, critical: 0, score: 100, severity: "healthy", label: "Healthy", warningCount: 0, failureCount: 0 },
            jobHealthStatus: "Healthy",
            podHealthStatus: "Healthy",
        };
    }
};

// Helper function to get job status metrics for pie chart
const getJobStatusMetrics = async () => {
    try {
        const response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
        });
        const jobs = response.items || [];

        const statusCounts: { [key: string]: number } = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jobs.forEach((job: any) => {
            const state = job.status?.state?.phase || job.status?.state || "Unknown";
            statusCounts[state] = (statusCounts[state] || 0) + 1;
        });

        // Convert to chart data format
        const chartData = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
        }));

        return chartData;
    } catch (error) {
        console.error("Error fetching job status metrics:", error);
        return [];
    }
};

// Helper function to get queue resources metrics for bar chart
const getQueueResourcesMetrics = async () => {
    try {
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });
        const queues = response.items || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queueMetrics = queues.map((queue: any) => {
            const spec = queue.spec || {};
            const status = queue.status || {};
            const allocated = status.allocated || {};
            const capability = spec.capability || {};

            const runningPods =
                (status.running ?? 0) +
                (status.pending ?? 0) +
                (status.inqueue ?? 0);

            return {
                name: queue.metadata?.name || "Unknown",
                weight: spec.weight || 0,
                reclaimable: spec.reclaimable ?? status.reclaimable ?? false,
                cpu: allocated.cpu != null ? String(allocated.cpu) : "0",
                memory: allocated.memory != null ? String(allocated.memory) : "0",
                pods: allocated.pods != null ? String(allocated.pods) : String(runningPods),
                cpuCapability: capability.cpu != null ? String(capability.cpu) : "0",
                memoryCapability:
                    capability.memory != null ? String(capability.memory) : "0",
                podsCapability:
                    capability.pods != null ? String(capability.pods) : "0",
            };
        });

        return queueMetrics;
    } catch (error) {
        console.error("Error fetching queue resources metrics:", error);
        return [];
    }
};

export const dashboardRouter = router({
    getSummary: procedure.query(async () => {
        const summary = await getSummary();
        return summary;
    }),
    getJobStatusMetrics: procedure.query(async () => {
        const jobStatusMetrics = await getJobStatusMetrics();
        return jobStatusMetrics;
    }),
    getQueueMetrics: procedure.query(async () => {
        const queueResourcesMetrics = await getQueueResourcesMetrics();
        return queueResourcesMetrics;
    }),
});

