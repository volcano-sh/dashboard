import sinon from "sinon";
import request from "supertest";
import { app } from "../src/server.js";
import { CoreV1Api, CustomObjectsApi } from "@kubernetes/client-node";

describe("backend", () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should fetch jobs", async () => {
        const mockResponse = {
            items: [
                {
                    metadata: { name: "job1" },
                    spec: { queue: "default" },
                    status: { state: { phase: "Running" } },
                },
                {
                    metadata: { name: "job2" },
                    spec: { queue: "default" },
                    status: { state: { phase: "Pending" } },
                },
            ],
        };

        sandbox
            .stub(CustomObjectsApi.prototype, "listClusterCustomObject")
            .resolves(mockResponse);

        const res = await request(app).get("/api/jobs");

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0].metadata.name).toBe("job1");
    });

    it("should fetch podgroups", async () => {
        const mockResponse = {
            items: [
                {
                    metadata: { name: "pg1", namespace: "default" },
                    status: { phase: "Running" },
                },
                {
                    metadata: { name: "pg2", namespace: "default" },
                    status: { phase: "Pending" },
                },
            ],
        };

        const stub = sandbox.stub(
            CustomObjectsApi.prototype,
            "listClusterCustomObject",
        );

        // Updated for OBJECT arguments using sinon matchers
        stub.withArgs(
            sinon.match({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "podgroups",
            }),
        ).resolves(mockResponse);

        // Fallback for others
        stub.resolves({ items: [] });

        const res = await request(app).get("/api/podgroups");

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0].metadata.name).toBe("pg1");
    });

    it("should delete a pod", async () => {
        sandbox.stub(CoreV1Api.prototype, "deleteNamespacedPod").resolves({
            body: { status: "Success" },
        });

        const res = await request(app).delete("/api/pod/default/pod-1");

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Pod deleted successfully");
    });

    it("should update a pod", async () => {
        sandbox.stub(CoreV1Api.prototype, "patchNamespacedPod").resolves({
            body: {
                metadata: { name: "pod-1", namespace: "default" },
            },
        });

        const res = await request(app)
            .patch("/api/pod/default/pod-1")
            .send({
                metadata: { labels: { app: "updated" } },
                spec: { containers: [] },
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Pod updated successfully");
    });
});
