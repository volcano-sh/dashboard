import { k8sApi, k8sCoreApi } from "../utils/k8s";

export const fetchJobs = async (
    page: number,
    pageSize: number,
) => {
    let response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: "true",
        });


    let filteredJobs = response.items || [];
        
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
    page: number,
    pageSize: number,
) => {
    const response = await k8sApi.listClusterCustomObject({
        group: "scheduling.volcano.sh",
        version: "v1beta1",
        plural: "queues",
    });

    let filteredQueues = response.items || [];

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

    return {
        items: paginatedQueues,
        totalCount: filteredQueues.length,
    };
};

export const fetchPods = async (
    page: number,
    pageSize: number,
) => {
    let response = await k8sCoreApi.listPodForAllNamespaces();

    let filteredPods = response.items || [];


    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPods = filteredPods.slice(startIndex, endIndex);

    return {
        items: paginatedPods,
        totalCount: filteredPods.length,
    };
};

