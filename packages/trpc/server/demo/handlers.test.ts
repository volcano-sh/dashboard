import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { resetDemoFixturesCache } from "./fixtures";
import {
    getDemoJobs,
    getDemoPodGroups,
    getDemoPods,
    getDemoQueues,
    getDemoSummary,
} from "./handlers";
import { assertDemoWritable } from "../utils/demo";

describe("demo handlers", () => {
    it("returns non-empty fixture-backed lists", () => {
        resetDemoFixturesCache();

        expect(getDemoQueues(1, 10).total).toBeGreaterThan(0);
        expect(getDemoJobs(1, 10).total).toBeGreaterThan(0);
        expect(getDemoPods(1, 10).total).toBeGreaterThan(0);
        expect(getDemoPodGroups(1, 10).total).toBeGreaterThan(0);
    });

    it("paginates fixture data", () => {
        resetDemoFixturesCache();

        const page1 = getDemoQueues(1, 2);
        const page2 = getDemoQueues(2, 2);

        expect(page1.items).toHaveLength(2);
        expect(page1.page).toBe(1);
        expect(page2.page).toBe(2);
        expect(page1.total).toBeGreaterThan(page1.items.length);
    });

    it("derives dashboard summary metrics from fixtures", () => {
        resetDemoFixturesCache();

        const summary = getDemoSummary();

        expect(summary.totalJobs).toBeGreaterThan(0);
        expect(summary.runningPods).toBeGreaterThan(0);
        expect(summary.completeRate).toMatch(/%$/);
    });

    it("blocks write operations in demo mode", () => {
        expect(() => assertDemoWritable()).toThrow(TRPCError);
    });
});
