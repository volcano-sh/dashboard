import { k8sApi, k8sCoreApi } from "../../utils/k8s";

export const fetchJobs = async (
    namespace: string,
    searchTerm: string,
    queueFilter: string,
    statusFilter: string
) => {
    let response;
    if (namespace === "" || namespace === "All") {
        response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: "true"
        });
    } else {
        response = await k8sApi.listNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            pretty: "true"
        });
    }

    let filteredJobs = response.body.items || [];

    if (searchTerm) {
        filteredJobs = filteredJobs.filter((job: any) =>
            job.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (queueFilter && queueFilter !== "All") {
        filteredJobs = filteredJobs.filter(
            (job: any) => job.spec.queue === queueFilter
        );
    }

    if (statusFilter && statusFilter !== "All") {
        filteredJobs = filteredJobs.filter(
            (job: any) => job.status.state.phase === statusFilter
        );
    }

    return filteredJobs;
};

interface Job {
    status?: {
        state?: {
            phase?: string;
        };
    } | string;
    spec?: {
        minAvailable?: number;
        queue?: string;
    };
    metadata: {
        name: string;
    };
}

export function getJobState(job: Job) {
    if (typeof job.status === "object" && job.status?.state) {
        return job.status.state.phase || "Unknown";
    }
    if (typeof job.status === "string") {
        if (job.status === "Running") return "Running";
        if (job.status === "Completed") return "Completed";
        if (job.status === "Failed") return "Failed";
        if (job.status === "Pending") return "Running";
        return job.status;
    }
    return "Unknown";
}

export const fetchQueues = async (searchTerm: string, stateFilter: string) => {
    const response = await k8sApi.listClusterCustomObject({
        group: "scheduling.volcano.sh",
        version: "v1beta1",
        plural: "queues"
    });

    let filteredQueues = response.body.items || [];

    if (searchTerm) {
        filteredQueues = filteredQueues.filter((queue: any) =>
            queue.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (stateFilter && stateFilter !== "All") {
        filteredQueues = filteredQueues.filter(
            (pod: any) => pod.status.state === stateFilter
        );
    }

    return filteredQueues;
};

export const fetchPods = async (
    namespace: string,
    searchTerm: string,
    statusFilter: string
) => {
    let response;
    if (namespace === "" || namespace === "All") {
        response = await k8sCoreApi.listPodForAllNamespaces();
    } else {
        response = await k8sCoreApi.listNamespacedPod({
            namespace
        });
    }

    let filteredPods = response.items || [];

    if (searchTerm) {
        filteredPods = filteredPods.filter((pod: any) =>
            pod.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (statusFilter && statusFilter !== "All") {
        filteredPods = filteredPods.filter(
            (pod: any) => pod.status.phase === statusFilter
        );
    }

    return filteredPods;
};
