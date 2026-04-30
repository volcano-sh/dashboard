import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchQueuePodGroupMetrics: vi.fn(),
    fetchQueueSchedulerMetrics: vi.fn(),
    listClusterCustomObject: vi.fn(),
}));

vi.mock("../lib/server/kubernetes", () => ({
    getKubernetesClients: () => ({
        k8sApi: {
            listClusterCustomObject: mocks.listClusterCustomObject,
        },
    }),
    yamlResponse: (data) => JSON.stringify(data),
}));

vi.mock("../lib/server/queue-metrics", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("../lib/server/queue-metrics")>();
    return {
        ...actual,
        fetchQueuePodGroupMetrics: mocks.fetchQueuePodGroupMetrics,
        fetchQueueSchedulerMetrics: mocks.fetchQueueSchedulerMetrics,
    };
});

describe("queue scheduler metrics", () => {
    it("preserves schedulerConfig.ControllersMetricEndpoint", async () => {
        const { normalizeDashboardConfig } = await import(
            "../lib/server/config"
        );

        const config = normalizeDashboardConfig({
            schedulerConfig: {
                ControllersMetricEndpoint: "http://127.0.0.1:18081/metrics",
                SchedulerMetricEndpoint: "http://127.0.0.1:18080/metrics",
            },
        });

        expect(config.schedulerConfig.ControllersMetricEndpoint).toBe(
            "http://127.0.0.1:18081/metrics",
        );
        expect(config.schedulerConfig.SchedulerMetricEndpoint).toBe(
            "http://127.0.0.1:18080/metrics",
        );
    });

    it("parses queue scheduler resource and fairness metrics", async () => {
        const { parseQueueSchedulerMetrics, getQueueSchedulerMetrics } =
            await import("../lib/server/queue-metrics");

        const metrics = parseQueueSchedulerMetrics(`
volcano_queue_request_milli_cpu{queue_name="test"} 100
volcano_queue_allocated_milli_cpu{queue_name="test"} 50
volcano_queue_deserved_milli_cpu{queue_name="test"} 200
volcano_queue_request_memory_bytes{queue_name="test"} 67108864
volcano_queue_allocated_memory_bytes{queue_name="test"} 33554432
volcano_queue_deserved_memory_bytes{queue_name="test"} 134217728
volcano_queue_request_scalar_resources{queue_name="test",resource="pods"} 2
volcano_queue_allocated_scalar_resources{queue_name="test",resource="pods"} 1
volcano_queue_deserved_scalar_resources{queue_name="test",resource="pods"} 4
volcano_queue_weight{queue_name="test"} 3
volcano_queue_share{queue_name="test"} 1
volcano_queue_overused{queue_name="test"} 1
malformed line
volcano_other_metric{queue_name="test"} 999
`);

        expect(getQueueSchedulerMetrics(metrics, "test")).toMatchObject({
            cpu: {
                allocatedMilli: 50,
                deservedMilli: 200,
                requestedMilli: 100,
            },
            memory: {
                allocatedBytes: 33554432,
                deservedBytes: 134217728,
                requestedBytes: 67108864,
            },
            scalar: {
                pods: {
                    allocated: 1,
                    deserved: 4,
                    requested: 2,
                },
            },
            scheduling: {
                overused: true,
                share: 1,
                weight: 3,
            },
            source: "scheduler-metrics",
        });
        expect(getQueueSchedulerMetrics(metrics, "missing")).toEqual({
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
        });
    });

    it("parses queue PodGroup counts from controller metrics", async () => {
        const { parseQueuePodGroupMetrics, getQueuePodGroupCounts } =
            await import("../lib/server/queue-metrics");

        const counts = parseQueuePodGroupMetrics(`
volcano_queue_pod_group_running_count{queue_name="test"} 2
volcano_queue_pod_group_pending_count{queue_name="test"} 1
volcano_queue_pod_group_inqueue_count{queue_name="test"} 3
`);

        expect(getQueuePodGroupCounts(counts, "test")).toEqual({
            inqueue: 3,
            pending: 1,
            running: 2,
            source: "controller-metrics",
        });
    });

    it("merges scheduler metrics into queue summaries", async () => {
        mocks.listClusterCustomObject.mockResolvedValue({
            items: [
                {
                    metadata: { name: "test" },
                    spec: {},
                    status: { state: "Open" },
                },
            ],
        });
        mocks.fetchQueueSchedulerMetrics.mockResolvedValue({
            metrics: new Map([
                [
                    "test",
                    {
                        cpu: {
                            allocatedMilli: 50,
                            deservedMilli: 200,
                            requestedMilli: 100,
                        },
                        memory: {
                            allocatedBytes: 33554432,
                            deservedBytes: 134217728,
                            requestedBytes: 67108864,
                        },
                        scalar: {},
                        scheduling: { overused: true, share: 1, weight: 3 },
                        source: "scheduler-metrics",
                    },
                ],
            ]),
            source: "metrics",
        });
        mocks.fetchQueuePodGroupMetrics.mockResolvedValue({
            counts: new Map([
                [
                    "test",
                    {
                        inqueue: 3,
                        pending: 1,
                        running: 2,
                        source: "controller-metrics",
                    },
                ],
            ]),
            source: "controller-metrics",
        });

        const { listQueues } = await import("../lib/server/volcano-api");
        const response = await listQueues(
            new Request("http://dashboard.local/api/v1/queues"),
        );
        const body = await response.json();

        expect(body.items[0].summary.schedulerMetrics).toMatchObject({
            cpu: {
                allocatedMilli: 50,
                deservedMilli: 200,
                requestedMilli: 100,
            },
            scheduling: { overused: true, share: 1, weight: 3 },
            podGroups: {
                inqueue: 3,
                pending: 1,
                running: 2,
            },
            source: "scheduler-metrics",
        });
    });
});
