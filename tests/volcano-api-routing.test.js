import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const apiDir = join(process.cwd(), "app", "api");
const versionedApiDir = join(apiDir, "v1");

describe("volcano API routing", () => {
    it("keeps dashboard API routes under /api/v1", () => {
        expect(existsSync(versionedApiDir)).toBe(true);

        [
            "cluster-info",
            "jobs",
            "namespaces",
            "podgroups",
            "pods",
            "queues",
            "scheduler",
        ].forEach((resource) => {
            expect(existsSync(join(versionedApiDir, resource))).toBe(true);
            expect(existsSync(join(apiDir, resource))).toBe(false);
        });
    });
});
