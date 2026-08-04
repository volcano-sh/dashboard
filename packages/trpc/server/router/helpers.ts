import { k8sApi, k8sCoreApi } from "../utils/k8s";
import { buildPaginatedResponse, type PaginatedResponse } from "./pagination";

const LIST_CHUNK_LIMIT = 250;

/**
 * Kubernetes list APIs have no cheap "count" endpoint — the only way to know
 * how many items match is to walk the entire list. Doing that on every page
 * request (see fetchPaginatedK8sList below) means a paginated table with a
 * handful of visible rows still costs O(total items in the cluster) per
 * request. A few seconds of staleness on a displayed total is not
 * noticeable in a UI, so it's cached briefly instead of recomputed every
 * time.
 */
const TOTAL_COUNT_CACHE_TTL_MS = 20_000;
const totalCountCache = new Map<string, { total: number; expiresAt: number }>();

function getCachedTotal(cacheKey: string): number | undefined {
    const entry = totalCountCache.get(cacheKey);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        totalCountCache.delete(cacheKey);
        return undefined;
    }
    return entry.total;
}

function setCachedTotal(cacheKey: string, total: number): void {
    totalCountCache.set(cacheKey, { total, expiresAt: Date.now() + TOTAL_COUNT_CACHE_TTL_MS });
}

/** Call after a create/delete mutation so the next list request recomputes a fresh total. */
export function invalidateTotalCount(cacheKeyPrefix: string): void {
    Array.from(totalCountCache.keys()).forEach((key) => {
        if (key === cacheKeyPrefix || key.startsWith(`${cacheKeyPrefix}:`)) {
            totalCountCache.delete(key);
        }
    });
}

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
        /** Cache key for the expensive total-count walk. Omit to always recompute. */
        cacheKey?: string;
    } = {},
): Promise<PaginatedResponse<T>> {
    const filter = options.filter ?? (() => true);
    const countWithFilter = options.countWithFilter ?? false;
    const cacheKey = options.cacheKey;
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

    const cachedTotal = cacheKey ? getCachedTotal(cacheKey) : undefined;

    let total: number;
    if (cachedTotal !== undefined) {
        total = cachedTotal;
    } else if (countWithFilter) {
        total = await countFilteredItems(listPage, filter);
    } else if (totalFromFirstChunk !== undefined) {
        total = totalFromFirstChunk;
    } else {
        total = await countFilteredItems(listPage, filter);
    }

    if (cacheKey && cachedTotal === undefined) {
        setCachedTotal(cacheKey, total);
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
        { cacheKey: "jobs" },
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
        { cacheKey: "queues" },
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
            cacheKey: "pods",
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
    const status = filters.status?.trim() ?? "";

    const matchesFilters = (pg: PodGroupLike) => {
        if (pg.metadata?.deletionTimestamp) return false;
        if (search && !String(pg.metadata?.name ?? "").toLowerCase().includes(search)) {
            return false;
        }
        if (status && status !== "All" && pg.status?.phase !== status) {
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
        cacheKey: `podgroups:${namespace}:${search}:${status}`,
    });
};
