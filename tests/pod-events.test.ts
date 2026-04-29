import { describe, expect, it, vi } from "vitest";

const listNamespacedEvent = vi.fn();

vi.mock("../lib/server/kubernetes", () => ({
    getKubernetesClients: () => ({
        k8sCoreApi: { listNamespacedEvent },
    }),
    yamlResponse: vi.fn(),
}));

const { getPodEvents } = await import("../lib/server/volcano-api");

describe("pod events API", () => {
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
});
