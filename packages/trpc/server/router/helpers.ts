import { k8sApi, k8sCoreApi } from "../utils/k8s";
import { buildPaginatedResponse, type PaginatedResponse } from "./pagination";

const LIST_CHUNK_LIMIT = 250;

type K8sListPageResult = {
    items: unknown[];
    continueToken?: string;
    remainingItemCount?: number;
};

type ListPageFn = (limit: number, continueToken?: string) => Promise<K8sListPageResult>;

/**
 * Kubernetes list APIs have no offset — reaching page N requires advancing continue
 * tokens. Only one page of matching items is retained in memory.
 */
async function fetchPaginatedK8sList<T>(
    page: number,
    pageSize: number,
    listPage: ListPageFn,
    options: {
        filter?: (item: T) => boolean;
        /** When true, walk all chunks to count filter matches (post-list filters). */
        countWithFilter?: boolean;
    } = {},
): Promise<PaginatedResponse<T>> {
    const filter = options.filter ?? (() => true);
    const countWithFilter = options.countWithFilter ?? false;
    const skipTarget = (page - 1) * pageSize;

    let continueToken: string | undefined;
    let skipped = 0;
    const pageItems: T[] = [];
    let totalFromFirstChunk: number | undefined;
    let isFirstRequest = true;

    while (pageItems.length < pageSize) {
        const response = await listPage(LIST_CHUNK_LIMIT, continueToken);
        const filtered = ((response.items ?? []) as T[]).filter(filter);

        if (
            isFirstRequest &&
            page === 1 &&
            !countWithFilter &&
            response.remainingItemCount !== undefined
        ) {
            totalFromFirstChunk = filtered.length + response.remainingItemCount;
        }
        isFirstRequest = false;

        for (const item of filtered) {
            if (skipped < skipTarget) {
                skipped++;
                continue;
            }
            if (pageItems.length < pageSize) {
                pageItems.push(item);
            }
        }

        continueToken = response.continueToken;
        if (!continueToken) {
            break;
        }
    }

    let total: number;
    if (countWithFilter) {
        total = await countFilteredItems(listPage, filter);
    } else if (totalFromFirstChunk !== undefined) {
        total = totalFromFirstChunk;
    } else {
        total = await countFilteredItems(listPage, filter);
    }

    return buildPaginatedResponse(pageItems, page, pageSize, total);
}

async function countFilteredItems<T>(
    listPage: ListPageFn,
    filter: (item: T) => boolean,
): Promise<number> {
    let total = 0;
    let continueToken: string | undefined;

    do {
        const response = await listPage(LIST_CHUNK_LIMIT, continueToken);
        const items = (response.items ?? []) as T[];
        total += items.filter(filter).length;
        continueToken = response.continueToken;
    } while (continueToken);

    return total;
}

function extractListMeta(response: {
    items?: unknown[];
    metadata?: { _continue?: string; remainingItemCount?: number };
}): K8sListPageResult {
    return {
        items: response.items ?? [],
        continueToken: response.metadata?._continue,
        remainingItemCount: response.metadata?.remainingItemCount,
    };
}

export const fetchJobs = async (
    page: number,
    pageSize: number,
): Promise<PaginatedResponse<unknown>> => {
    return fetchPaginatedK8sList(
        page,
        pageSize,
        async (limit, continueToken) => {
            const response = await k8sApi.listClusterCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                plural: "jobs",
                pretty: "true",
                limit,
                ...(continueToken && { continue: continueToken }),
            });
            return extractListMeta(response);
        },
    );
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
): Promise<PaginatedResponse<unknown>> => {
    return fetchPaginatedK8sList(
        page,
        pageSize,
        async (limit, continueToken) => {
            const response = await k8sApi.listClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                limit,
                ...(continueToken && { continue: continueToken }),
            });
            return extractListMeta(response);
        },
    );
};

type PodLike = { metadata?: { deletionTimestamp?: unknown } };

export const fetchPods = async (
    page: number,
    pageSize: number,
): Promise<PaginatedResponse<unknown>> => {
    return fetchPaginatedK8sList(
        page,
        pageSize,
        async (limit, continueToken) => {
            const response = await k8sCoreApi.listPodForAllNamespaces({
                limit,
                ...(continueToken && { continue: continueToken }),
            });
            return extractListMeta(response);
        },
        {
            filter: (pod) => !(pod as PodLike).metadata?.deletionTimestamp,
            countWithFilter: true,
        },
    );
};

type PodGroupLike = {
    metadata?: { name?: string; deletionTimestamp?: unknown };
    status?: { phase?: string };
};

export const fetchPodGroups = async (
    page: number,
    pageSize: number,
    filters: {
        namespace?: string;
        search?: string;
        status?: string;
    } = {},
): Promise<PaginatedResponse<unknown>> => {
    const namespace = filters.namespace?.trim() ?? "";
    const search = filters.search?.trim().toLowerCase() ?? "";
    const status = filters.status?.trim().toLowerCase() ?? "";

    const matchesFilters = (pg: PodGroupLike) => {
        if (pg.metadata?.deletionTimestamp) return false;
        if (search && !String(pg.metadata?.name ?? "").toLowerCase().includes(search)) {
            return false;
        }
        if (status && status !== "all" && pg.status?.phase?.toLowerCase() !== status) {
            return false;
        }
        return true;
    };

    const listPage: ListPageFn = async (limit, continueToken) => {
        if (namespace && namespace !== "All") {
            const response = await k8sApi.listNamespacedCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                namespace,
                plural: "podgroups",
                limit,
                ...(continueToken && { continue: continueToken }),
            });
            return extractListMeta(response);
        }

        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "podgroups",
            limit,
            ...(continueToken && { continue: continueToken }),
        });
        return extractListMeta(response);
    };

    return fetchPaginatedK8sList(page, pageSize, listPage, {
        filter: matchesFilters,
        countWithFilter: true,
    });
};
