
import { procedure, router } from "../../trpc";
import { k8sApi, k8sCoreApi } from "../../utils/k8s";

// Helper function to get summary statistics
const getSummary = async () => {
    try {
        // Get all jobs
        const jobsResponse = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
        });
        const jobs = jobsResponse.items || [];

        // Get all pods
        const podsResponse = await k8sCoreApi.listPodForAllNamespaces();
        const pods = podsResponse.items || [];

        // Calculate metrics
        const totalJobs = jobs.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeJobs = jobs.filter((job: any) => {
            const state = job.status?.state?.phase || job.status?.state || "Unknown";
            return ["Running", "Pending", "Inqueue"].includes(state);
        }).length;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const runningPods = pods.filter((pod: any) =>
            pod.status?.phase === "Running"
        ).length;


        const completeRate = totalJobs > 0
            ? `${Math.round(((totalJobs - activeJobs) / totalJobs) * 100)}%`
            : "0%";

        return {
            totalJobs,
            activeJobs,
            runningPods,
            completeRate,
        };
    } catch (error) {
        console.error("Error fetching summary:", error);
        return {
            totalJobs: 0,
            activeJobs: 0,
            runningPods: 0,
            completeRate: "0%",
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

            return {
                name: queue.metadata?.name || "Unknown",
                weight: spec.weight || 0,
                reclaimable: status.reclaimable || false,
                inqueue: status.inqueue || 0,
                pending: status.pending || 0,
                running: status.running || 0,
                unknown: status.unknown || 0,
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

