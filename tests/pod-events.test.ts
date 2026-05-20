import { beforeEach, describe, expect, it, vi } from "vitest";

const listNamespacedEvent = vi.fn();
const listEventForAllNamespaces = vi.fn();
const readNamespacedPod = vi.fn();

vi.mock("../lib/server/kubernetes", () => ({
    getKubernetesClients: () => ({
        k8sCoreApi: {
            listEventForAllNamespaces,
            listNamespacedEvent,
            readNamespacedPod,
        },
    }),
    yamlResponse: vi.fn(),
}));

const {
    getCronJobEvents,
    getJobEvents,
    getPodEvents,
    getPodGroupEvents,
    getQueueEvents,
} = await import("../lib/server/volcano-api");

beforeEach(() => {
    listEventForAllNamespaces.mockReset();
    listNamespacedEvent.mockReset();
    readNamespacedPod.mockReset();
    readNamespacedPod.mockResolvedValue({
        metadata: {
            annotations: {
                "scheduling.volcano.sh/queue-name": "research",
            },
            name: "demo-pod",
            namespace: "volcano-demo",
        },
        spec: {},
    });
});

describe("resource events API", () => {
    it("lists pod events with the generated client object parameter shape", async () => {
        listNamespacedEvent.mockResolvedValueOnce({
            items: [
                {
                    count: 2,
                    lastTimestamp: "2026-04-24T02:28:59Z",
                    message: "scheduled",
                    reason: "Scheduled",
                    type: "Normal",
                },
            ],
        });

        const response = await getPodEvents("volcano-demo", "demo-pod");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(listNamespacedEvent).toHaveBeenCalledWith({
            namespace: "volcano-demo",
            fieldSelector:
                "involvedObject.kind=Pod,involvedObject.name=demo-pod",
        });
        expect(body).toMatchObject({
            items: [
                {
                    count: 2,
                    message: "scheduled",
                    reason: "Scheduled",
                    type: "Normal",
                },
            ],
            totalCount: 1,
        });
    });

    it("lists job events with the generated client object parameter shape", async () => {
        listNamespacedEvent.mockResolvedValueOnce({
            items: [
                {
                    count: 1,
                    lastTimestamp: "2026-04-24T02:29:59Z",
                    message: "job pending",
                    metadata: { name: "demo-job.1", uid: "event-1" },
                    reason: "Pending",
                    type: "Warning",
                },
            ],
        });

        const response = await getJobEvents("volcano-demo", "demo-job");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(listNamespacedEvent).toHaveBeenCalledWith({
            namespace: "volcano-demo",
            fieldSelector:
                "involvedObject.kind=Job,involvedObject.name=demo-job",
        });
        expect(body).toMatchObject({
            items: [
                {
                    count: 1,
                    message: "job pending",
                    reason: "Pending",
                    type: "Warning",
                    uid: "event-1",
                },
            ],
            totalCount: 1,
        });
    });

    it("lists cronjob events with the generated client object parameter shape", async () => {
        listNamespacedEvent.mockResolvedValueOnce({
            items: [
                {
                    count: 3,
                    lastTimestamp: "2026-04-24T02:30:59Z",
                    message: "created job",
                    metadata: { name: "demo-cronjob.1" },
                    reason: "SuccessfulCreate",
                    type: "Normal",
                },
            ],
        });

        const response = await getCronJobEvents("volcano-demo", "demo-cronjob");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(listNamespacedEvent).toHaveBeenCalledWith({
            namespace: "volcano-demo",
            fieldSelector:
                "involvedObject.kind=CronJob,involvedObject.name=demo-cronjob",
        });
        expect(body).toMatchObject({
            items: [
                {
                    count: 3,
                    message: "created job",
                    reason: "SuccessfulCreate",
                    type: "Normal",
                    uid: "demo-cronjob.1",
                },
            ],
            totalCount: 1,
        });
    });

    it("lists podgroup events with the generated client object parameter shape", async () => {
        listNamespacedEvent.mockResolvedValueOnce({
            items: [
                {
                    count: 1,
                    lastTimestamp: "2026-04-24T02:31:59Z",
                    message: "podgroup unschedulable",
                    metadata: { name: "demo-pg.1" },
                    reason: "Unschedulable",
                    type: "Warning",
                },
            ],
        });

        const response = await getPodGroupEvents("volcano-demo", "demo-pg");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(listNamespacedEvent).toHaveBeenCalledWith({
            namespace: "volcano-demo",
            fieldSelector:
                "involvedObject.kind=PodGroup,involvedObject.name=demo-pg",
        });
        expect(body).toMatchObject({
            items: [
                {
                    count: 1,
                    message: "podgroup unschedulable",
                    reason: "Unschedulable",
                    type: "Warning",
                },
            ],
            totalCount: 1,
        });
    });

    it("lists queue events across namespaces because queues are cluster-scoped", async () => {
        listEventForAllNamespaces.mockResolvedValueOnce({
            items: [
                {
                    count: 1,
                    lastTimestamp: "2026-04-24T02:32:59Z",
                    message: "queue opened",
                    metadata: { name: "root.1" },
                    reason: "Opened",
                    type: "Normal",
                },
            ],
        });

        const response = await getQueueEvents("root");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(listEventForAllNamespaces).toHaveBeenCalledWith({
            fieldSelector: "involvedObject.kind=Queue,involvedObject.name=root",
        });
        expect(body).toMatchObject({
            items: [
                {
                    count: 1,
                    message: "queue opened",
                    reason: "Opened",
                    type: "Normal",
                },
            ],
            totalCount: 1,
        });
    });
});
