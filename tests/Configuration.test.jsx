import Configuration from "../components/configuration/Configuration";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";

vi.mock("axios");

const schedulerConfig = {
    target: {
        namespace: "volcano-system",
        name: "volcano-scheduler-configmap",
        key: "volcano-scheduler.conf",
    },
    scheduler: {
        name: "volcano",
        actions: ["enqueue", "allocate", "backfill"],
    },
    policies: {
        queueOrder: "priority",
        jobOrder: "fifo",
        resourceOrder: "binpack",
        nodeOrder: "leastrequested",
        backfill: true,
        reclaim: true,
    },
    plugins: [
        {
            tier: "enqueue",
            name: "gang",
            enabled: true,
            arguments: { strict: true },
            hooks: ["JobEnqueueable", "JobEnqueued", "JobReady"],
            actions: ["enqueue", "allocate"],
            hookMappingAvailable: true,
        },
        {
            tier: "allocate",
            name: "predicates",
            enabled: true,
            arguments: {},
            hooks: ["PredicateFn"],
            actions: ["allocate", "backfill"],
            hookMappingAvailable: true,
        },
    ],
    preemption: {
        enabled: true,
        victimSelection: "BestEffort",
        raw: { victimSelection: "BestEffort" },
    },
    flow: {
        actions: [
            {
                name: "enqueue",
                order: 1,
                title: "ENQUEUE",
                subtitle: "Admit into Queue",
                goal: "Decide whether the job can enter the scheduling queue.",
                resultSuccess: "Admitted to queue",
                resultFailure: "Rejected",
            },
            {
                name: "allocate",
                order: 2,
                title: "ALLOCATE",
                subtitle: "Allocate Resources",
                goal: "Find and reserve the best node(s) for the job.",
                resultSuccess: "Bind to node(s)",
                resultFailure: "Keep waiting",
            },
            {
                name: "backfill",
                order: 3,
                title: "BACKFILL",
                subtitle: "Utilize Idle Resources",
                goal: "Schedule lower-priority or BestEffort jobs using idle resources.",
                resultSuccess: "Utilize idle resources",
                resultFailure: "No resources",
            },
        ],
        hooksByAction: {
            enqueue: ["JobEnqueueable", "JobEnqueued"],
            allocate: ["Allocatable", "PredicateFn", "NodeOrderFn", "JobReady"],
            backfill: ["PredicateFn", "NodeOrderFn"],
        },
        plugins: [
            {
                tier: "enqueue",
                name: "gang",
                enabled: true,
                arguments: { strict: true },
                description: "Ensure gang scheduling constraints.",
                hooks: ["JobEnqueueable", "JobEnqueued", "JobReady"],
                actions: ["enqueue", "allocate"],
                hookMappingAvailable: true,
            },
            {
                tier: "allocate",
                name: "predicates",
                enabled: true,
                arguments: {},
                description: "Filter out nodes that do not meet requirements.",
                hooks: ["PredicateFn"],
                actions: ["allocate", "backfill"],
                hookMappingAvailable: true,
            },
        ],
        stepsByAction: {
            enqueue: [
                {
                    order: 1,
                    hook: "JobEnqueueable",
                    label: "Step 1",
                    plugins: [
                        {
                            tier: "enqueue",
                            name: "gang",
                            enabled: true,
                            arguments: { strict: true },
                            description: "Ensure gang scheduling constraints.",
                            hooks: ["JobEnqueueable", "JobEnqueued", "JobReady"],
                            actions: ["enqueue", "allocate"],
                            hookMappingAvailable: true,
                        },
                    ],
                },
                {
                    order: 2,
                    hook: "JobEnqueued",
                    label: "Step 2",
                    plugins: [
                        {
                            tier: "enqueue",
                            name: "gang",
                            enabled: true,
                            arguments: { strict: true },
                            description: "Ensure gang scheduling constraints.",
                            hooks: ["JobEnqueueable", "JobEnqueued", "JobReady"],
                            actions: ["enqueue", "allocate"],
                            hookMappingAvailable: true,
                        },
                    ],
                },
            ],
            allocate: [
                {
                    order: 1,
                    hook: "PredicateFn",
                    label: "Step 1",
                    plugins: [
                        {
                            tier: "allocate",
                            name: "predicates",
                            enabled: true,
                            arguments: {},
                            description:
                                "Filter out nodes that do not meet requirements.",
                            hooks: ["PredicateFn"],
                            actions: ["allocate", "backfill"],
                            hookMappingAvailable: true,
                        },
                    ],
                },
            ],
            backfill: [],
        },
        edges: [],
        legend: {
            configured: "Configured items come from ConfigMap.",
            derived: "Derived items come from Volcano semantics.",
        },
    },
    rawYaml: "actions: enqueue, allocate, backfill",
};

const renderConfiguration = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <Configuration />
        </QueryClientProvider>,
    );
};

describe("Configuration", () => {
    beforeEach(() => {
        axios.get.mockResolvedValue({ data: schedulerConfig });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should render the default scheduler configuration tab", async () => {
        renderConfiguration();

        expect(
            screen.getByRole("heading", { name: /configuration/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /scheduler configuration/i }),
        ).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText(/^scheduler profile$/i)).toBeInTheDocument();
        expect(
            screen.queryByRole("tab", { name: /^queues$/i }),
        ).not.toBeInTheDocument();
        expect(
            await screen.findByText("volcano-scheduler-configmap"),
        ).toBeInTheDocument();
        expect(screen.getByText(/^default actions$/i)).toBeInTheDocument();
        expect(screen.getByText("enqueue")).toBeInTheDocument();
        expect(
            screen.queryAllByText(/^Raw Scheduler YAML$/i).length,
        ).toBe(1);
    });

    it("should render scheduling flow content when selecting the Scheduling Flow tab", async () => {
        renderConfiguration();

        fireEvent.click(screen.getByRole("tab", { name: /scheduling flow/i }));

        expect(
            (await screen.findAllByText(/^Scheduling Flow$/i)).length,
        ).toBeGreaterThan(1);
        expect(await screen.findByText(/^ENQUEUE$/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Step 1/i).length).toBeGreaterThan(0);
    });

    it("should render plugins content when selecting the Plugins tab", async () => {
        renderConfiguration();

        fireEvent.click(screen.getByRole("tab", { name: /plugins/i }));

        expect(screen.getByText(/plugins configuration/i)).toBeInTheDocument();
        expect((await screen.findAllByText("gang")).length).toBeGreaterThan(0);
        expect(screen.getByText("Plugin Details")).toBeInTheDocument();
        expect(screen.getByText("Hooks")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should render raw yaml content when selecting the Raw Scheduler YAML tab", async () => {
        renderConfiguration();

        fireEvent.click(
            screen.getByRole("tab", { name: /raw scheduler yaml/i }),
        );

        expect(screen.getAllByText(/^Raw Scheduler YAML$/i).length).toBeGreaterThan(1);
        expect(
            await screen.findByText(/no raw yaml available\.|actions: enqueue, allocate, backfill/i),
        ).toBeInTheDocument();
    });

    it("should not render a preemption tab", () => {
        renderConfiguration();

        expect(
            screen.queryByRole("tab", { name: /preemption/i }),
        ).not.toBeInTheDocument();
    });
});
