import { describe, expect, it } from "vitest";
import {
    getQueueResourceStats,
    getQueueResourceStatusItems,
    getQueueUsageSummary,
    parseResourceQuantity,
    QUEUE_RESOURCE_COLUMNS,
} from "../components/queues/queueResourceUsage";

const resource = (key) =>
    QUEUE_RESOURCE_COLUMNS.find((item) => item.key === key);

describe("queue resource usage", () => {
    it("normalizes cpu and memory quantities for percentages", () => {
        expect(parseResourceQuantity("500m", resource("cpu"))).toBe(0.5);
        expect(parseResourceQuantity("1Ti", resource("memory"))).toBe(1024);
        expect(parseResourceQuantity("256Mi", resource("memory"))).toBe(0.25);
    });

    it("builds reusable CPU, memory, and GPU usage items", () => {
        const queue = {
            spec: {
                capability: {
                    cpu: "8",
                    memory: "1Ti",
                    "nvidia.com/gpu": "4",
                },
                deserved: {
                    cpu: "4",
                    memory: "512Gi",
                    "nvidia.com/gpu": "2",
                },
                guarantee: {
                    resource: {
                        cpu: "2",
                        memory: "256Gi",
                        "nvidia.com/gpu": "1",
                    },
                },
            },
            status: {
                allocated: {
                    cpu: "3",
                    memory: "256Gi",
                    "nvidia.com/gpu": "1",
                },
            },
        };

        const items = getQueueResourceStatusItems(queue);

        expect(items).toHaveLength(3);
        expect(items.map((item) => item.resource.key)).toEqual([
            "cpu",
            "memory",
            "gpu",
        ]);
        expect(items[0].stats.usageLabel).toBe("75%");
        expect(items[0].valueText).toBe("3 / 4 / 8 cores (75%)");
        expect(items[1].stats.usageLabel).toBe("50%");
        expect(items[1].valueText).toBe("256Gi / 512Gi / 1Ti (50%)");
        expect(items[2].stats.usageLabel).toBe("50%");
    });

    it("marks usage above capability as hot", () => {
        const queue = {
            spec: {
                capability: { cpu: "2" },
                deserved: { cpu: "2" },
            },
            status: {
                allocated: { cpu: "3" },
            },
        };

        const stats = getQueueResourceStats(queue, resource("cpu"));

        expect(stats.overCapability).toBe(true);
        expect(stats.usageTone).toBe("hot");
        expect(stats.usageLabel).toBe("150%");
        expect(stats.usedPercent).toBe(100);
    });

    it("summarizes aggregate queue usage from normalized resource values", () => {
        const summary = getQueueUsageSummary({
            spec: {
                deserved: {
                    cpu: "2",
                    memory: "1Gi",
                },
            },
            status: {
                allocated: {
                    cpu: "1",
                    memory: "512Mi",
                },
            },
        });

        expect(summary.usagePercent).toBe(50);
    });
});
