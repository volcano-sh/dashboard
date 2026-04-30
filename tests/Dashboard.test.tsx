import Dashboard from "../components/dashboard/Dashboard";
import { render, screen } from "@testing-library/react";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("axios");

const queue = {
    metadata: {
        name: "demo-prod",
    },
    spec: {
        weight: 1,
    },
    status: {
        state: "Open",
    },
    summary: {
        schedulerMetrics: {
            cpu: {
                allocatedMilli: 1000,
                deservedMilli: 2000,
                requestedMilli: 1000,
            },
            memory: {
                allocatedBytes: 64 * 1024 * 1024,
                deservedBytes: 128 * 1024 * 1024,
                requestedBytes: 64 * 1024 * 1024,
            },
            podGroups: {
                inqueue: 0,
                pending: 0,
                running: 1,
            },
            scalar: {
                pods: {
                    allocated: 1,
                    deserved: 2,
                    requested: 1,
                },
            },
            scheduling: {
                overused: false,
                share: 0.5,
                weight: 2,
            },
            source: "scheduler-metrics",
        },
    },
};

const renderDashboard = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <Dashboard />
        </QueryClientProvider>,
    );
};

describe("Dashboard", () => {
    beforeEach(() => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/jobs") {
                return Promise.resolve({
                    data: {
                        items: [
                            { summary: { status: "Running" } },
                            { summary: { status: "Pending" } },
                        ],
                    },
                });
            }
            if (url === "/api/v1/queues") {
                return Promise.resolve({
                    data: {
                        items: [queue],
                    },
                });
            }
            if (url === "/api/v1/pods") {
                return Promise.resolve({
                    data: {
                        items: [
                            { summary: { status: "Running" } },
                            { summary: { status: "Pending" } },
                        ],
                    },
                });
            }
            if (url === "/api/v1/scheduler/metrics") {
                return Promise.resolve({
                    data: {
                        scheduling: {
                            actionLatency: [
                                { action: "allocate", avgMs: 20, count: 5 },
                                { action: "backfill", avgMs: 10, count: 2 },
                                { action: "enqueue", avgMs: 8, count: 2 },
                            ],
                            avgLatencyMs: 250.5,
                            latency: {
                                e2eAvgMs: 250.5,
                                jobAvgMs: 300,
                                taskAvgMs: 600,
                            },
                            latencyBuckets: {
                                e2e: [
                                    {
                                        bucketCount: 2,
                                        cumulativeCount: 2,
                                        le: "5",
                                        percent: 50,
                                        upperBoundMs: 5,
                                    },
                                    {
                                        bucketCount: 2,
                                        cumulativeCount: 4,
                                        le: "+Inf",
                                        percent: 50,
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
                            ],
                            preemption: {
                                attempts: 0,
                                victims: 0,
                            },
                            samples: 4,
                            source: "scheduler-metrics",
                            unschedulable: {
                                jobs: 2,
                                tasks: 1,
                                topTasks: [{ jobId: "pg-a", tasks: 1 }],
                            },
                        },
                    },
                });
            }
            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });
    });

    it("uses scheduler metrics and removes stale overview labels", async () => {
        renderDashboard();

        expect((await screen.findAllByText("250.5 ms")).length).toBeGreaterThan(0);
        expect(screen.getByText("Total Jobs")).toBeInTheDocument();
        expect(screen.getByText("Running Jobs")).toBeInTheDocument();
        expect(screen.getByText("Running Pods")).toBeInTheDocument();
        expect(screen.getByText("Avg Scheduling Latency")).toBeInTheDocument();
        expect(screen.getByLabelText("Total Jobs source")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Avg Scheduling Latency source"),
        ).toBeInTheDocument();
        expect(screen.getByText("from SchedulerMetricEndpoint")).toBeInTheDocument();
        expect(screen.getByText("Scheduler Resource Allocation")).toBeInTheDocument();
        expect(screen.getByText("Allocated / deserved by queue")).toBeInTheDocument();
        expect(screen.getByText("Resources")).toBeInTheDocument();
        expect(screen.getByText("Weight")).toBeInTheDocument();
        expect(screen.getByText("Fairness Share")).toBeInTheDocument();
        expect(screen.getAllByText("Status").length).toBeGreaterThan(0);
        expect(screen.getByText("CPU")).toBeInTheDocument();
        expect(screen.getByText("Memory")).toBeInTheDocument();
        expect(screen.getByText("Pods")).toBeInTheDocument();
        expect(screen.getByText("Scheduler Metrics")).toBeInTheDocument();
        expect(
            screen.getByText("Scheduling Latency Distribution"),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Scheduling Latency Distribution source"),
        ).toBeInTheDocument();
        expect(screen.getByText("Queue Health Distribution")).toBeInTheDocument();
        expect(screen.getByText("Queue Status Summary")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Queue Status Summary source"),
        ).toBeInTheDocument();
        expect(screen.getByText("Healthy Queues")).toBeInTheDocument();
        expect(screen.getByLabelText("Healthy Queues source")).toBeInTheDocument();
        expect(screen.getByText("Degraded Queues")).toBeInTheDocument();
        expect(screen.getByLabelText("Degraded Queues source")).toBeInTheDocument();
        expect(screen.getByText("Overused Queues")).toBeInTheDocument();
        expect(screen.getByLabelText("Overused Queues source")).toBeInTheDocument();
        expect(screen.getByText("Starving Queues")).toBeInTheDocument();
        expect(screen.getByLabelText("Starving Queues source")).toBeInTheDocument();
        expect(screen.getByText("Latency Breakdown")).toBeInTheDocument();
        expect(screen.getByText("Action Latency")).toBeInTheDocument();
        expect(screen.getByText("Plugin Latency (Top 5)")).toBeInTheDocument();
        expect(screen.getByText("Unschedulable")).toBeInTheDocument();
        expect(screen.getByText("Preemption")).toBeInTheDocument();
        expect(screen.getByText("allocate")).toBeInTheDocument();
        expect(screen.getByText("backfill")).toBeInTheDocument();
        expect(screen.getByText("enqueue")).toBeInTheDocument();
        expect(screen.getByText("gang / OnSessionOpen")).toBeInTheDocument();
        expect(screen.getByText("Pod Status Distribution")).toBeInTheDocument();
        expect(screen.queryByText("Current Signals")).not.toBeInTheDocument();
        expect(screen.queryByText("Scheduling Success Rate")).not.toBeInTheDocument();
        expect(screen.queryByText("Resource Usage Trend")).not.toBeInTheDocument();
        expect(screen.queryByText("Last 15 minutes")).not.toBeInTheDocument();
    });
});
