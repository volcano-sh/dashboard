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

    it("parses scheduler snapshot metrics from histogram counters and gauges", async () => {
        const { parseSchedulerMetricsSummary } = await import(
            "../lib/server/queue-metrics"
        );

        const summary = parseSchedulerMetricsSummary(`
# HELP volcano_e2e_scheduling_latency_milliseconds E2e scheduling latency in milliseconds
volcano_e2e_scheduling_latency_milliseconds_bucket{le="5"} 1
volcano_e2e_scheduling_latency_milliseconds_bucket{le="10"} 2
volcano_e2e_scheduling_latency_milliseconds_bucket{le="+Inf"} 3
volcano_e2e_scheduling_latency_milliseconds_sum 1500
volcano_e2e_scheduling_latency_milliseconds_count 3
volcano_e2e_job_scheduling_latency_milliseconds_sum 900
volcano_e2e_job_scheduling_latency_milliseconds_count 3
volcano_task_scheduling_latency_milliseconds_sum 2400
volcano_task_scheduling_latency_milliseconds_count 4
volcano_action_scheduling_latency_milliseconds_sum{action="allocate"} 100
volcano_action_scheduling_latency_milliseconds_count{action="allocate"} 5
volcano_action_scheduling_latency_milliseconds_sum{action="backfill"} 20
volcano_action_scheduling_latency_milliseconds_count{action="backfill"} 2
volcano_plugin_scheduling_latency_milliseconds_sum{plugin="gang",OnSession="OnSessionOpen"} 90
volcano_plugin_scheduling_latency_milliseconds_count{plugin="gang",OnSession="OnSessionOpen"} 3
volcano_plugin_scheduling_latency_milliseconds_sum{plugin="drf",OnSession="OnSessionClose"} 20
volcano_plugin_scheduling_latency_milliseconds_count{plugin="drf",OnSession="OnSessionClose"} 2
volcano_unschedule_job_count 2
volcano_unschedule_task_count{job_id="pg-a"} 3
volcano_unschedule_task_count{job_id="pg-b"} 1
volcano_pod_preemption_victims 4
volcano_total_preemption_attempts 5
malformed line
volcano_other_metric 999
`);

        expect(summary).toMatchObject({
            scheduling: {
                actionLatency: [
                    { action: "allocate", avgMs: 20, count: 5 },
                    { action: "backfill", avgMs: 10, count: 2 },
                ],
                avgLatencyMs: 500,
                latency: {
                    e2eAvgMs: 500,
                    jobAvgMs: 300,
                    taskAvgMs: 600,
                },
                latencyBuckets: {
                    e2e: [
                        {
                            bucketCount: 1,
                            cumulativeCount: 1,
                            le: "5",
                            percent: 33.33333333333333,
                            upperBoundMs: 5,
                        },
                        {
                            bucketCount: 1,
                            cumulativeCount: 2,
                            le: "10",
                            percent: 33.33333333333333,
                            upperBoundMs: 10,
                        },
                        {
                            bucketCount: 1,
                            cumulativeCount: 3,
                            le: "+Inf",
                            percent: 33.33333333333333,
                            upperBoundMs: null,
                        },
                    ],
                },
                pluginLatency: [
                    {
                        avgMs: 30,
                        count: 3,
                        onSession: "OnSessionOpen",
                        plugin: "gang",
                    },
                    {
                        avgMs: 10,
                        count: 2,
                        onSession: "OnSessionClose",
                        plugin: "drf",
                    },
                ],
                preemption: {
                    attempts: 5,
                    victims: 4,
                },
                samples: 3,
                source: "scheduler-metrics",
                unschedulable: {
                    jobs: 2,
                    tasks: 4,
                    topTasks: [
                        { jobId: "pg-a", tasks: 3 },
                        { jobId: "pg-b", tasks: 1 },
                    ],
                },
            },
        });
    });

    it("returns unavailable scheduler latency when samples are missing", async () => {
        const { parseSchedulerMetricsSummary } = await import(
            "../lib/server/queue-metrics"
        );

        expect(
            parseSchedulerMetricsSummary(`
volcano_e2e_scheduling_latency_milliseconds_sum 1500
volcano_e2e_scheduling_latency_milliseconds_count 0
`),
        ).toEqual({
            scheduling: {
                actionLatency: [],
                avgLatencyMs: null,
                latency: {
                    e2eAvgMs: null,
                    jobAvgMs: null,
                    taskAvgMs: null,
                },
                latencyBuckets: {
                    e2e: [],
                },
                pluginLatency: [],
                preemption: {
                    attempts: 0,
                    victims: 0,
                },
                samples: 0,
                source: "unavailable",
                unschedulable: {
                    jobs: 0,
                    tasks: 0,
                    topTasks: [],
                },
            },
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
