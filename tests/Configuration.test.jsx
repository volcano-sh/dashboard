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
        },
        {
            tier: "allocate",
            name: "predicates",
            enabled: true,
            arguments: {},
        },
    ],
    preemption: {
        enabled: true,
        victimSelection: "BestEffort",
        raw: { victimSelection: "BestEffort" },
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
    });

    it("should render policies content when selecting the Policies tab", async () => {
        renderConfiguration();

        fireEvent.click(screen.getByRole("tab", { name: /policies/i }));

        expect(await screen.findByText("priority")).toBeInTheDocument();
        expect(screen.getByText(/queue ordering/i)).toBeInTheDocument();
        expect(screen.getByText("binpack")).toBeInTheDocument();
    });

    it("should render plugins content when selecting the Plugins tab", async () => {
        renderConfiguration();

        fireEvent.click(screen.getByRole("tab", { name: /plugins/i }));

        expect(screen.getByText(/plugins configuration/i)).toBeInTheDocument();
        expect((await screen.findAllByText("gang")).length).toBeGreaterThan(0);
        expect(screen.getByText("Plugin Details")).toBeInTheDocument();
    });

    it("should render preemption content when selecting the Preemption tab", async () => {
        renderConfiguration();

        fireEvent.click(screen.getByRole("tab", { name: /preemption/i }));

        expect(
            screen.getByText(/preemption configuration/i),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText(/victim selection policy/i).length,
        ).toBeGreaterThan(0);
        expect(
            (await screen.findAllByText("BestEffort")).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText(/raw scheduler yaml/i)).toBeInTheDocument();
    });
});
