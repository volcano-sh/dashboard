import sinon from "sinon";
import request from "supertest";
import { app } from "../src/server.js";
import { CustomObjectsApi, CoreV1Api } from "@kubernetes/client-node";

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

    describe("GET /api/scheduler/config", () => {
        it("returns configmap data on success", async () => {
            const mockCM = {
                metadata: {
                    name: "volcano-scheduler-configmap",
                    namespace: "volcano-system",
                    resourceVersion: "12345",
                },
                data: {
                    "volcano-scheduler.conf":
                        "actions: \"enqueue, allocate\"\nplugins:\n",
                },
            };

            sandbox
                .stub(CoreV1Api.prototype, "readNamespacedConfigMap")
                .resolves(mockCM);

            const res = await request(app).get("/api/scheduler/config");

            expect(res.status).toBe(200);
            expect(res.body.name).toBe("volcano-scheduler-configmap");
            expect(res.body.data).toHaveProperty("volcano-scheduler.conf");
        });

        it("returns 500 when the k8s call fails", async () => {
            sandbox
                .stub(CoreV1Api.prototype, "readNamespacedConfigMap")
                .rejects(new Error("forbidden"));

            const res = await request(app).get("/api/scheduler/config");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch scheduler config");
        });
    });

    describe("GET /api/scheduler/logs", () => {
        it("returns logs for a valid component", async () => {
            sandbox
                .stub(CoreV1Api.prototype, "listNamespacedPod")
                .resolves({
                    items: [
                        {
                            metadata: { name: "volcano-scheduler-abc" },
                            status: { phase: "Running" },
                        },
                    ],
                });

            sandbox
                .stub(CoreV1Api.prototype, "readNamespacedPodLog")
                .resolves("I0503 scheduler started\n");

            const res = await request(app).get(
                "/api/scheduler/logs?component=scheduler&tailLines=50",
            );

            expect(res.status).toBe(200);
            expect(res.body.component).toBe("scheduler");
            expect(res.body.pod).toBe("volcano-scheduler-abc");
            expect(res.body.logs).toContain("scheduler started");
        });

        it("returns 400 for an unknown component", async () => {
            const res = await request(app).get(
                "/api/scheduler/logs?component=unknown-thing",
            );

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/Unknown component/);
        });

        it("returns 404 when no running pod is found", async () => {
            sandbox
                .stub(CoreV1Api.prototype, "listNamespacedPod")
                .resolves({ items: [] });

            const res = await request(app).get("/api/scheduler/logs");

            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/No running pod found/);
        });
    });
});
