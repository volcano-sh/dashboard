import PodGroups from "../components/podgroups/PodGroups";
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

vi.mock("@monaco-editor/react", () => ({
    default: ({ onChange, value }) => (
        <textarea
            aria-label="yaml editor"
            onChange={(event) => onChange(event.target.value)}
            value={value}
        />
    ),
}));

const podGroupsResponse = {
    data: {
        facets: {
            namespaces: ["All", "volcano-demo"],
        },
        items: [
            {
                metadata: {
                    creationTimestamp: "2026-04-23T02:23:58Z",
                    name: "demo-pg",
                    namespace: "volcano-demo",
                },
                spec: {
                    minMember: 1,
                    queue: "demo-prod",
                },
                status: {
                    phase: "Running",
                },
                summary: {
                    status: "Running",
                },
            },
        ],
        totalCount: 1,
    },
};

const queuesResponse = {
    data: {
        items: [
            {
                metadata: {
                    name: "demo-prod",
                },
            },
        ],
    },
};

describe("PodGroups", () => {
    const renderPodGroups = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        return render(
            <QueryClientProvider client={queryClient}>
                <PodGroups />
            </QueryClientProvider>,
        );
    };

    beforeEach(() => {
        mocks.auth.canWrite = true;
        axios.get.mockImplementation((url) => {
            if (url.includes("/queues")) return Promise.resolve(queuesResponse);
            return Promise.resolve(podGroupsResponse);
        });
        axios.post.mockResolvedValue({
            data: { message: "PodGroup created successfully" },
        });
        vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("opens a YAML create dialog for PodGroup creation", async () => {
        renderPodGroups();

        await waitFor(() => {
            expect(screen.getByText("demo-pg")).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole("button", { name: /create podgroup/i }),
        );

        expect(screen.getByText("Create a PodGroup")).toBeInTheDocument();
        expect(
            screen.getByText(/Paste or type your PodGroup YAML specification/i),
        ).toBeInTheDocument();
        expect(window.alert).not.toHaveBeenCalledWith(
            "Create PodGroup not implemented yet",
        );
    });

    it("hides PodGroup create actions for read-only users", async () => {
        mocks.auth.canWrite = false;

        renderPodGroups();

        await waitFor(() => {
            expect(screen.getByText("demo-pg")).toBeInTheDocument();
        });

        expect(
            screen.queryByRole("button", { name: /create podgroup/i }),
        ).not.toBeInTheDocument();
    });
});
