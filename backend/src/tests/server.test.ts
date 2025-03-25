import sinon, { SinonSandbox, SinonStub } from "sinon";
import request from "supertest";
import { CustomObjectsApi } from "@kubernetes/client-node";
import app from "../app";

describe("backend", () => {
    let sandbox: SinonSandbox;

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

        const listStub: SinonStub = sandbox
            .stub(CustomObjectsApi.prototype, "listClusterCustomObject")
            .resolves(mockResponse);

        const res = await request(app).get("/api/jobs");

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0].metadata.name).toBe("job1");

        expect(listStub.calledOnce).toBe(true);
    });
});
