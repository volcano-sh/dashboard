import { k8sApi, k8sCoreApi } from "../../utils/k8s";

export const fetchJobs = async (
    namespace: string,
    search: string,
    queue: string,
    status: string,
    page: number,
    pageSize: number,
) => {
    let response;
    if (namespace === "" || namespace === "All") {
        response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: "true",
        });
    } else {
        response = await k8sApi.listNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            pretty: "true",
        });
    }

    let filteredJobs = response.items || [];

    if (search) {
        filteredJobs = filteredJobs.filter((job: any) =>
            job.metadata.name.toLowerCase().includes(search.toLowerCase()),
        );
    }

    if (queue && queue !== "All") {
        filteredJobs = filteredJobs.filter(
            (job: any) => job.spec.queue === queue,
        );
    }

    if (status && status !== "All") {
        filteredJobs = filteredJobs.filter(
            (job: any) => job.status.state.phase === status,
        );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return {
        items: paginatedJobs,
        totalCount: filteredJobs.length,
    };
};

interface Job {
    status?:
        | {
              state?: {
                  phase?: string;
              };
          }
        | string;
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
        return job.status;
    }
    return "Unknown";
}

export const fetchQueues = async (
    search: string,
    state: string,
    page: number,
    pageSize: number,
) => {
    const response = await k8sApi.listClusterCustomObject({
        group: "scheduling.volcano.sh",
        version: "v1beta1",
        plural: "queues",
    });

    let filteredQueues = response.items || [];

    if (search) {
        filteredQueues = filteredQueues.filter((queue: any) =>
            queue.metadata.name.toLowerCase().includes(search.toLowerCase()),
        );
    }

    if (state && state !== "All") {
        filteredQueues = filteredQueues.filter(
            (pod: any) => pod.status.state === state,
        );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

    return {
        items: paginatedQueues,
        totalCount: filteredQueues.length,
    };
};

export const fetchPods = async (
    namespace: string,
    search: string,
    status: string,
    page: number,
    pageSize: number,
) => {
    let response;
    if (namespace === "" || namespace === "All") {
        response = await k8sCoreApi.listPodForAllNamespaces();
    } else {
        response = await k8sCoreApi.listNamespacedPod({
            namespace,
        });
    }

    let filteredPods = response.items || [];

    if (search) {
        filteredPods = filteredPods.filter((pod: any) =>
            pod.metadata.name.toLowerCase().includes(search.toLowerCase()),
        );
    }

    if (status && status !== "All") {
        filteredPods = filteredPods.filter(
            (pod: any) => pod.status.phase === status,
        );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPods = filteredPods.slice(startIndex, endIndex);

    return {
        items: paginatedPods,
        totalCount: filteredPods.length,
    };
};
