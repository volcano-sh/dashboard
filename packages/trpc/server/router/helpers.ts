import { k8sApi, k8sCoreApi } from "../utils/k8s";

export const fetchJobs = async (
    page: number,
    pageSize: number,
) => {
    let continueToken: string | undefined;
    let allItems: any[] = [];
    let currentPage = 1;

    // Fetch all pages up to the requested page
    while (currentPage <= page) {
        const response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: "true",
            limit: pageSize,
            ...(continueToken && { continue: continueToken }),
        });

        const items = response.items || [];
        allItems = allItems.concat(items);

        // Check if there are more items to fetch
        continueToken = response.metadata?._continue;

        // If we're on the requested page or there are no more items, break
        if (currentPage === page || !continueToken) {
            break;
        }

        currentPage++;
    }

    // Get the items for the requested page
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = allItems.slice(startIndex, endIndex);

    return {
        items: paginatedJobs,
        totalCount: allItems.length,
        hasMore: !!continueToken,
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
    let continueToken: string | undefined;
    let allItems: any[] = [];
    let currentPage = 1;

    // Fetch all pages up to the requested page
    while (currentPage <= page) {
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            limit: pageSize,
            ...(continueToken && { continue: continueToken }),
        });

        const items = response.items || [];
        allItems = allItems.concat(items);

        // Check if there are more items to fetch
        continueToken = response.metadata?._continue;

        // If we're on the requested page or there are no more items, break
        if (currentPage === page || !continueToken) {
            break;
        }

        currentPage++;
    }

    // Get the items for the requested page
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedQueues = allItems.slice(startIndex, endIndex);

    return {
        items: paginatedQueues,
        totalCount: allItems.length,
        hasMore: !!continueToken,
    };
};

export const fetchPods = async (
    page: number,
    pageSize: number,
) => {
    let continueToken: string | undefined;
    let allItems: any[] = [];
    let currentPage = 1;

    // Fetch all pages up to the requested page
    while (currentPage <= page) {
        const response = await k8sCoreApi.listPodForAllNamespaces({
            limit: pageSize,
            ...(continueToken && { continue: continueToken }),
        });

        const items = response.items || [];
        allItems = allItems.concat(items);

        // Check if there are more items to fetch
        continueToken = response.metadata?._continue;

        // If we're on the requested page or there are no more items, break
        if (currentPage === page || !continueToken) {
            break;
        }

        currentPage++;
    }

    // Get the items for the requested page
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPods = allItems.slice(startIndex, endIndex);

    return {
        items: paginatedPods,
        totalCount: allItems.length,
        hasMore: !!continueToken,
    };
};

