import Queues from "../components/queues/Queues";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({
    auth: {
        canWrite: true,
    },
}));

vi.mock("axios");
vi.mock("../components/auth/AuthProvider", () => ({
    useAuth: () => mocks.auth,
}));

const queueResponse = {
    data: {
        items: [
            {
                metadata: {
                    name: "root",
                    creationTimestamp: "2026-04-23T02:23:58Z",
                },
                spec: {
                    weight: 1,
                    capability: { cpu: "500", memory: "1Ti" },
                    guarantee: { resource: { cpu: "100", memory: "256Gi" } },
                    reclaimable: true,
                },
                status: {
                    state: "Open",
                },
                summary: {
                    schedulerMetrics: {
                        cpu: {
                            allocatedMilli: 100,
                            deservedMilli: 200,
                            requestedMilli: 100,
                        },
                        memory: {
                            allocatedBytes: 67108864,
                            deservedBytes: 134217728,
                            requestedBytes: 67108864,
                        },
                        podGroups: {
                            inqueue: 3,
                            pending: 1,
                            running: 2,
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
                            share: 1,
                            weight: 5,
                        },
                        source: "scheduler-metrics",
                    },
                },
            },
            {
                metadata: {
                    name: "prod",
                    creationTimestamp: "2026-04-23T02:23:58Z",
                },
                spec: {
                    parent: "root",
                    weight: 1,
                    capability: { cpu: "500", memory: "1Ti" },
                    reclaimable: true,
                },
                status: {
                    state: "Open",
                },
                summary: {
                    schedulerMetrics: {
                        cpu: {
                            allocatedMilli: 100,
                            deservedMilli: 200,
                            requestedMilli: 100,
                        },
                        memory: {
                            allocatedBytes: 67108864,
                            deservedBytes: 134217728,
                            requestedBytes: 67108864,
                        },
                        podGroups: {
                            inqueue: 3,
                            pending: 1,
                            running: 2,
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
                            share: 1,
                            weight: 5,
                        },
                        source: "scheduler-metrics",
                    },
                },
            },
        ],
        totalCount: 2,
    },
};

describe("Queues", () => {
    const renderQueues = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        return render(
            <QueryClientProvider client={queryClient}>
                <Queues />
            </QueryClientProvider>,
        );
    };

    beforeEach(() => {
        mocks.auth.canWrite = true;
        const storage = {};
        vi.stubGlobal("localStorage", {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => {
                storage[key] = value;
            },
        });
        axios.get.mockResolvedValue(queueResponse);
    });

    it("should render hierarchy only and open details after selecting a queue", async () => {
        renderQueues();

        expect(
            screen.getByRole("heading", { name: /queues/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/queue hierarchy/i)).toBeInTheDocument();
        expect(screen.queryByText(/queue details/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/^view:/i)).not.toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("prod")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("prod"));

        await waitFor(() => {
            expect(screen.getByText(/queue: prod/i)).toBeInTheDocument();
        });
        expect(screen.getByText("Create Queue")).toBeInTheDocument();
    });

    it("shows scheduler metric PodGroup counts and resource values", async () => {
        renderQueues();

        await waitFor(() => {
            expect(screen.getByText("prod")).toBeInTheDocument();
        });

        expect(screen.getByText("Priority / Weight")).toBeInTheDocument();
        expect(screen.getByText("Running")).toBeInTheDocument();
        expect(screen.getByText("Pending / Inqueue")).toBeInTheDocument();
        expect(
            screen.getByLabelText(
                "Running PodGroups from Volcano scheduler metric volcano_queue_pod_group_running_count.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText(
                "Pending/Inqueue PodGroups from Volcano scheduler metrics.",
            ),
        ).toBeInTheDocument();
        expect(screen.getAllByText("2").length).toBeGreaterThan(0);
        expect(screen.getAllByText("1 / 3").length).toBeGreaterThan(0);
        expect(screen.getAllByText("- / 5").length).toBeGreaterThan(0);
        expect(screen.queryByText("Running Pods / Jobs")).not.toBeInTheDocument();
        expect(screen.queryByText("Pending Jobs")).not.toBeInTheDocument();
    });

    it("disables queue write actions for read-only users", async () => {
        mocks.auth.canWrite = false;

        renderQueues();

        await waitFor(() => {
            expect(screen.getByText("prod")).toBeInTheDocument();
        });

        expect(
            screen.getByRole("button", { name: /create queue/i }),
        ).toBeDisabled();
        expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    });
});
