import { describe, expect, it } from "vitest";
import { handleApiRequest } from "../lib/server/volcano-api";

const request = (path) => new Request(`http://localhost${path}`);

describe("volcano API routing", () => {
    it.each([
        ["/api/job/default/demo/yaml", ["job", "default", "demo", "yaml"]],
        ["/api/pod/default/demo/yaml", ["pod", "default", "demo", "yaml"]],
        ["/api/queue/root/yaml", ["queue", "root", "yaml"]],
        ["/api/all-jobs", ["all-jobs"]],
        ["/api/all-queues", ["all-queues"]],
        ["/api/all-pods", ["all-pods"]],
    ])("returns 404 for removed legacy route %s", async (path, segments) => {
        const response = await handleApiRequest(request(path), segments);
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ error: "Not Found" });
    });
});
