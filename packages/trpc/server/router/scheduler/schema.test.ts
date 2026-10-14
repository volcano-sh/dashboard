import { describe, expect, it } from "vitest";
import { pluginOptionSchema, schedulerConfigSchema } from "./schema";

describe("schedulerConfigSchema", () => {
    it("accepts config with plugin enable flags", () => {
        const result = schedulerConfigSchema.safeParse({
            actions: ["enqueue", "allocate"],
            tiers: [
                {
                    plugins: [
                        { name: "priority" },
                        { name: "gang", enablePreemptable: false },
                    ],
                },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("rejects empty actions", () => {
        const result = schedulerConfigSchema.safeParse({
            actions: [],
            tiers: [{ plugins: [{ name: "priority" }] }],
        });
        expect(result.success).toBe(false);
    });

    it("accepts custom action names at schema level (blocked later by validateSchedulerConfig)", () => {
        const result = schedulerConfigSchema.safeParse({
            actions: ["enqueue", "my-custom-action"],
            tiers: [{ plugins: [{ name: "priority" }] }],
        });
        expect(result.success).toBe(true);
    });

    it("rejects empty action names", () => {
        const result = schedulerConfigSchema.safeParse({
            actions: ["enqueue", ""],
            tiers: [{ plugins: [{ name: "priority" }] }],
        });
        expect(result.success).toBe(false);
    });
});

describe("pluginOptionSchema", () => {
    it("accepts optional enable flags and arguments", () => {
        const result = pluginOptionSchema.safeParse({
            name: "binpack",
            enableNodeOrder: true,
            arguments: {
                "binpack.weight": 10,
                "predicate.CacheEnable": true,
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejects NaN and Infinity argument numbers", () => {
        expect(
            pluginOptionSchema.safeParse({
                name: "binpack",
                arguments: { "binpack.weight": Number.NaN },
            }).success
        ).toBe(false);
        expect(
            pluginOptionSchema.safeParse({
                name: "binpack",
                arguments: { "binpack.weight": Number.POSITIVE_INFINITY },
            }).success
        ).toBe(false);
    });
});
