import yaml from "js-yaml";
import { getJobState } from "../router/helpers";
import { buildPaginatedResponse } from "../router/pagination";
import { loadDemoFixtures } from "./fixtures";

type PodGroupFilters = {
    namespace?: string;
    search?: string;
    status?: string;
};

function paginate<T>(items: T[], page: number, pageSize: number) {
    const total = items.length;
    const start = (page - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    return buildPaginatedResponse(slice, page, pageSize, total);
}

function toYaml(data: unknown): string {
    return yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    });
}

export function getDemoSummary() {
    const { jobs, pods } = loadDemoFixtures();
    const activeJobs = jobs.filter((job) => {
        const state =
            (job.status?.state as { phase?: string } | undefined)?.phase ||
            getJobState(job as Parameters<typeof getJobState>[0]);
        return ["Running", "Pending", "Inqueue"].includes(String(state));
    }).length;
    const runningPods = pods.filter(
        (pod) => (pod.status?.phase as string | undefined) === "Running",
    ).length;
    const totalJobs = jobs.length;
    const completeRate =
        totalJobs > 0
            ? `${Math.round(((totalJobs - activeJobs) / totalJobs) * 100)}%`
            : "0%";

    return {
        totalJobs,
        activeJobs,
        runningPods,
        completeRate,
    };
}

export function getDemoJobStatusMetrics() {
    const { jobs } = loadDemoFixtures();
    const statusCounts: Record<string, number> = {};

    for (const job of jobs) {
        const state =
            (job.status?.state as { phase?: string } | undefined)?.phase ||
            getJobState(job as Parameters<typeof getJobState>[0]);
        statusCounts[String(state)] = (statusCounts[String(state)] || 0) + 1;
    }

    return Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
    }));
}

export function getDemoQueueMetrics() {
    const { queues } = loadDemoFixtures();

    return queues.map((queue) => {
        const spec = queue.spec || {};
        const status = queue.status || {};
        const allocated = (status.allocated as Record<string, unknown>) || {};
        const capability = (spec.capability as Record<string, unknown>) || {};
        const runningPods =
            Number(status.running ?? 0) +
            Number(status.pending ?? 0) +
            Number(status.inqueue ?? 0);

        return {
            name: queue.metadata?.name || "Unknown",
            weight: Number(spec.weight ?? 0),
            reclaimable: Boolean(spec.reclaimable ?? status.reclaimable ?? false),
            cpu: allocated.cpu != null ? String(allocated.cpu) : "0",
            memory: allocated.memory != null ? String(allocated.memory) : "0",
            pods:
                allocated.pods != null ? String(allocated.pods) : String(runningPods),
            cpuCapability:
                capability.cpu != null ? String(capability.cpu) : "0",
            memoryCapability:
                capability.memory != null ? String(capability.memory) : "0",
            podsCapability:
                capability.pods != null ? String(capability.pods) : "0",
        };
    });
}

export function getDemoQueues(page: number, pageSize: number) {
    const { queues } = loadDemoFixtures();
    return paginate(queues, page, pageSize);
}

export function getDemoQueue(name: string) {
    const { queues } = loadDemoFixtures();
    const queue = queues.find((item) => item.metadata?.name === name);
    if (!queue) {
        throw new Error(`Queue ${name} not found`);
    }
    return queue;
}

export function getDemoQueueYaml(name: string) {
    return toYaml(getDemoQueue(name));
}

export function getDemoAllQueues() {
    const { queues } = loadDemoFixtures();
    return {
        items: queues,
        totalCount: queues.length,
    };
}

export function getDemoJobs(page: number, pageSize: number) {
    const { jobs } = loadDemoFixtures();
    return paginate(jobs, page, pageSize);
}

export function getDemoJob(namespace: string, name: string) {
    const { jobs } = loadDemoFixtures();
    const job = jobs.find(
        (item) =>
            item.metadata?.name === name &&
            item.metadata?.namespace === namespace,
    );
    if (!job) {
        throw new Error(`Job ${namespace}/${name} not found`);
    }
    return job;
}

export function getDemoJobYaml(namespace: string, name: string) {
    return toYaml(getDemoJob(namespace, name));
}

export function getDemoAllJobs() {
    const { jobs } = loadDemoFixtures();
    return {
        items: jobs.map((job) => ({
            ...job,
            status: {
                state:
                    job.status?.state ||
                    getJobState(job as Parameters<typeof getJobState>[0]),
                phase:
                    (job.status as { phase?: string } | undefined)?.phase ||
                    "Unknown",
            },
        })),
        totalCount: jobs.length,
    };
}

export function getDemoPods(page: number, pageSize: number) {
    const { pods } = loadDemoFixtures();
    const activePods = pods.filter((pod) => !pod.metadata?.deletionTimestamp);
    return paginate(activePods, page, pageSize);
}

export function getDemoPod(namespace: string, name: string) {
    const { pods } = loadDemoFixtures();
    const pod = pods.find(
        (item) =>
            item.metadata?.name === name &&
            item.metadata?.namespace === namespace,
    );
    if (!pod) {
        throw new Error(`Pod ${namespace}/${name} not found`);
    }
    return pod;
}

export function getDemoPodYaml(namespace: string, name: string) {
    return toYaml(getDemoPod(namespace, name));
}

export function getDemoAllPods() {
    const { pods } = loadDemoFixtures();
    const defaultPods = pods.filter(
        (pod) => pod.metadata?.namespace === "default",
    );
    return {
        items: defaultPods,
        totalCount: defaultPods.length,
    };
}

export function getDemoPodGroups(
    page: number,
    pageSize: number,
    filters: PodGroupFilters = {},
) {
    const { podgroups } = loadDemoFixtures();
    const namespace = filters.namespace?.trim() ?? "";
    const search = filters.search?.trim().toLowerCase() ?? "";
    const status = filters.status?.trim() ?? "";

    const filtered = podgroups.filter((pg) => {
        if (pg.metadata?.deletionTimestamp) {
            return false;
        }
        if (namespace && namespace !== "All") {
            if (pg.metadata?.namespace !== namespace) {
                return false;
            }
        }
        if (search) {
            if (!String(pg.metadata?.name ?? "").toLowerCase().includes(search)) {
                return false;
            }
        }
        if (status && status !== "All") {
            if ((pg.status?.phase as string | undefined) !== status) {
                return false;
            }
        }
        return true;
    });

    return paginate(filtered, page, pageSize);
}

export function getDemoPodGroup(namespace: string, name: string) {
    const { podgroups } = loadDemoFixtures();
    const podgroup = podgroups.find(
        (item) =>
            item.metadata?.name === name &&
            item.metadata?.namespace === namespace,
    );
    if (!podgroup) {
        throw new Error(`PodGroup ${namespace}/${name} not found`);
    }
    return podgroup;
}

export function getDemoPodGroupYaml(namespace: string, name: string) {
    return toYaml(getDemoPodGroup(namespace, name));
}
