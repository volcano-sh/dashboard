import { beforeEach, describe, expect, it, vi } from "vitest";

const createNamespacedCustomObject = vi.fn();

vi.mock("../lib/server/kubernetes", () => ({
    getKubernetesClients: () => ({
        k8sApi: {
            createNamespacedCustomObject,
        },
    }),
    yamlResponse: vi.fn(),
}));

const { createCronJob, handleApiRequest } = await import(
    "../lib/server/volcano-api"
);

const cronJobManifest = {
    apiVersion: "batch.volcano.sh/v1alpha1",
    kind: "CronJob",
    metadata: {
        name: "demo-cronjob",
        namespace: "volcano-demo",
    },
    spec: {
        schedule: "*/5 * * * *",
        jobTemplate: {
            spec: {
                minAvailable: 1,
                schedulerName: "volcano",
                tasks: [],
            },
        },
    },
};

const requestWithBody = (body, method = "POST") =>
    new Request("http://dashboard.local/api/v1/cronjobs", {
        body: JSON.stringify(body),
        method,
    });

describe("cronjobs API", () => {
    beforeEach(() => {
        createNamespacedCustomObject.mockReset();
    });

    it("creates a Volcano CronJob in the manifest namespace", async () => {
        createNamespacedCustomObject.mockResolvedValueOnce({
            body: cronJobManifest,
        });

        const response = await createCronJob(requestWithBody(cronJobManifest));
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(createNamespacedCustomObject).toHaveBeenCalledWith({
            body: cronJobManifest,
            group: "batch.volcano.sh",
            namespace: "volcano-demo",
            plural: "cronjobs",
            version: "v1alpha1",
        });
        expect(body).toMatchObject({
            data: cronJobManifest,
            message: "CronJob created successfully",
        });
    });

    it("defaults CronJob creation to the default namespace when omitted", async () => {
        const manifest = {
            ...cronJobManifest,
            metadata: { name: "defaulted-cronjob" },
        };
        createNamespacedCustomObject.mockResolvedValueOnce({ body: manifest });

        const response = await createCronJob(requestWithBody(manifest));

        expect(response.status).toBe(201);
        expect(createNamespacedCustomObject).toHaveBeenCalledWith(
            expect.objectContaining({
                namespace: "default",
            }),
        );
    });

    it("rejects CronJob manifests without required identity or spec fields", async () => {
        const response = await createCronJob(
            requestWithBody({ metadata: { name: "broken-cronjob" } }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: "Invalid cronjob manifest" });
        expect(createNamespacedCustomObject).not.toHaveBeenCalled();
    });

    it("routes POST /cronjobs to CronJob creation", async () => {
        createNamespacedCustomObject.mockResolvedValueOnce({
            body: cronJobManifest,
        });

        const response = await handleApiRequest(requestWithBody(cronJobManifest), [
            "cronjobs",
        ]);

        expect(response.status).toBe(201);
        expect(createNamespacedCustomObject).toHaveBeenCalledWith(
            expect.objectContaining({
                plural: "cronjobs",
            }),
        );
    });
});
