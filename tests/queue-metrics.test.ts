import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchQueuePodGroupMetrics: vi.fn(),
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
    };
});

describe("queue controller metrics", () => {
    it("preserves schedulerConfig.ControllersMetricEndpoint", async () => {
        const { normalizeDashboardConfig } = await import(
            "../lib/server/config"
        );

        expect(
            normalizeDashboardConfig({
                schedulerConfig: {
                    ControllersMetricEndpoint:
                        "http://127.0.0.1:18081/metrics",
                },
            }).schedulerConfig.ControllersMetricEndpoint,
        ).toBe("http://127.0.0.1:18081/metrics");
    });

    it("parses queue PodGroup count metrics", async () => {
        const { parseQueuePodGroupMetrics, getQueuePodGroupCounts } =
            await import("../lib/server/queue-metrics");

        const metrics = parseQueuePodGroupMetrics(`
# HELP volcano_queue_pod_group_inqueue_count The number of Inqueue PodGroup in this queue
# TYPE volcano_queue_pod_group_inqueue_count gauge
volcano_queue_pod_group_inqueue_count{queue_name="default"} 0
volcano_queue_pod_group_inqueue_count{queue_name="test"} 1
# HELP volcano_queue_pod_group_pending_count The number of Pending PodGroup in this queue
# TYPE volcano_queue_pod_group_pending_count gauge
volcano_queue_pod_group_pending_count{queue_name="test"} 0
malformed line
volcano_other_metric{queue_name="test"} 999
# HELP volcano_queue_pod_group_running_count The number of Running PodGroup in this queue
# TYPE volcano_queue_pod_group_running_count gauge
volcano_queue_pod_group_running_count{queue_name="test"} 22
`);

        expect(getQueuePodGroupCounts(metrics, "test")).toEqual({
            inqueue: 1,
            pending: 0,
            running: 22,
            source: "controller-metrics",
        });
        expect(getQueuePodGroupCounts(metrics, "missing")).toEqual({
            inqueue: 0,
            pending: 0,
            running: 0,
            source: "unavailable",
        });
    });

    it("merges metrics counts into queue summaries", async () => {
        mocks.listClusterCustomObject.mockResolvedValue({
            items: [
                {
                    metadata: { name: "test" },
                    spec: {},
                    status: { state: "Open" },
                },
            ],
        });
        mocks.fetchQueuePodGroupMetrics.mockResolvedValue({
            counts: new Map([
                [
                    "test",
                    {
                        inqueue: 1,
                        pending: 0,
                        running: 22,
                        source: "controller-metrics",
                    },
                ],
            ]),
            source: "metrics",
        });

        const { listQueues } = await import("../lib/server/volcano-api");
        const response = await listQueues(
            new Request("http://dashboard.local/api/v1/queues"),
        );
        const body = await response.json();

        expect(body.items[0].summary.podGroups).toEqual({
            inqueue: 1,
            pending: 0,
            running: 22,
            source: "controller-metrics",
        });
    });
});
