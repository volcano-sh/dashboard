import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    deleteNamespacedPod: vi.fn(),
    listEventForAllNamespaces: vi.fn(),
    listNamespacedEvent: vi.fn(),
    listNamespacedPod: vi.fn(),
    listPodForAllNamespaces: vi.fn(),
    readNamespacedPod: vi.fn(),
    readNamespacedPodLog: vi.fn(),
}));

vi.mock("../lib/server/kubernetes", () => ({
    getKubernetesClients: () => ({
        k8sCoreApi: mocks,
    }),
    yamlResponse: (data) => JSON.stringify(data),
}));

const { deletePod, getPod, getPodEvents, getPodLogs, getPodYaml, listPods } =
    await import("../lib/server/volcano-api");

const pod = (name, spec = {}, metadata = {}) => ({
    metadata: {
        creationTimestamp: "2026-04-24T02:28:59Z",
        name,
        namespace: metadata.namespace || "volcano-demo",
        ...(metadata || {}),
    },
    spec,
    status: { phase: "Running" },
});

const queueAnnotations = (queue, podGroup = undefined) => ({
    annotations: {
        ...(podGroup ? { "scheduling.volcano.sh/group-name": podGroup } : {}),
        "scheduling.volcano.sh/queue-name": queue,
    },
});

beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("pods API", () => {
    it("lists only pods with Volcano queue annotations by default", async () => {
        mocks.listPodForAllNamespaces.mockResolvedValue({
            items: [
                pod("volcano-no-queue", { schedulerName: "volcano" }),
                pod(
                    "queued-without-scheduler-name",
                    {},
                    {
                        ...queueAnnotations("research", "pg-a"),
                        namespace: "ml",
                    },
                ),
                pod(
                    "queued-default-scheduler",
                    { schedulerName: "default-scheduler" },
                    {
                        ...queueAnnotations("batch"),
                        namespace: "batch",
                    },
                ),
                pod(
                    "label-only",
                    {},
                    {
                        labels: { "volcano.sh/queue": "research" },
                        namespace: "hidden",
                    },
                ),
            ],
        });

        const response = await listPods(
            new Request("http://dashboard.local/api/v1/pods"),
        );
        const body = await response.json();

        expect(mocks.listPodForAllNamespaces).toHaveBeenCalled();
        expect(body.items.map((item) => item.metadata.name)).toEqual([
            "queued-without-scheduler-name",
            "queued-default-scheduler",
        ]);
        expect(body.totalCount).toBe(2);
        expect(body.items[0].summary.queue).toBe("research");
        expect(body.items[0].summary.podGroup).toBe("pg-a");
        expect(body.facets).toEqual({
            namespaces: ["All", "batch", "ml"],
            podGroups: ["All", "pg-a"],
            queues: ["All", "batch", "research"],
        });
    });

    it("applies namespace, queue, and podgroup filters inside queue-owned pods", async () => {
        mocks.listNamespacedPod.mockResolvedValue({
            items: [
                pod(
                    "research",
                    {},
                    {
                        ...queueAnnotations("research", "pg-a"),
                        namespace: "ml",
                    },
                ),
                pod(
                    "research-other-podgroup",
                    {},
                    {
                        ...queueAnnotations("research", "pg-b"),
                        namespace: "ml",
                    },
                ),
                pod(
                    "plain-kubernetes",
                    {},
                    {
                        labels: { "volcano.sh/queue": "research" },
                        namespace: "ml",
                    },
                ),
            ],
        });

        const response = await listPods(
            new Request(
                "http://dashboard.local/api/v1/pods?namespace=ml&queue=research&podGroup=pg-a",
            ),
        );
        const body = await response.json();

        expect(mocks.listNamespacedPod).toHaveBeenCalledWith({
            namespace: "ml",
        });
        expect(body.items.map((item) => item.metadata.name)).toEqual([
            "research",
        ]);
        expect(body.facets).toEqual({
            namespaces: ["All", "ml"],
            podGroups: ["All", "pg-a", "pg-b"],
            queues: ["All", "research"],
        });
    });

    it("allows pod detail reads for queue-owned pods", async () => {
        mocks.readNamespacedPod.mockResolvedValue(
            pod("visible", {}, queueAnnotations("research")),
        );

        const response = await getPod("volcano-demo", "visible");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.summary.name).toBe("visible");
    });

    it("returns 404 for pod detail reads without queue annotations", async () => {
        mocks.readNamespacedPod.mockResolvedValue(
            pod("hidden", { schedulerName: "volcano" }),
        );

        const response = await getPod("default", "hidden");
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.message).toMatch(/not associated with a Volcano queue/i);
    });

    it("returns 404 for pod YAML, logs, events, and delete without queue annotations", async () => {
        mocks.readNamespacedPod.mockResolvedValue(
            pod("hidden", { schedulerName: "volcano" }),
        );

        const yamlResponse = await getPodYaml("default", "hidden");
        const logsResponse = await getPodLogs(
            new Request(
                "http://dashboard.local/api/v1/pods/default/hidden/logs",
            ),
            "default",
            "hidden",
        );
        const eventsResponse = await getPodEvents("default", "hidden");
        const deleteResponse = await deletePod("default", "hidden");

        expect(yamlResponse.status).toBe(404);
        expect(logsResponse.status).toBe(404);
        expect(eventsResponse.status).toBe(404);
        expect(deleteResponse.status).toBe(404);
        expect(mocks.readNamespacedPodLog).not.toHaveBeenCalled();
        expect(mocks.listNamespacedEvent).not.toHaveBeenCalled();
        expect(mocks.deleteNamespacedPod).not.toHaveBeenCalled();
    });
});
