import sinon from "sinon";
import request from "supertest";
import { app } from "../src/server.js";
import { CustomObjectsApi } from "@kubernetes/client-node";

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
});
