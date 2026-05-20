import { describe, expect, it } from "vitest";
import {
    formatCpuFromMilli,
    formatMemoryBytes,
    formatShare,
    getQueueResourceStats,
    getQueueResourceStatusItems,
    getQueueUsageSummary,
    QUEUE_RESOURCE_COLUMNS,
} from "../components/queues/queueResourceUsage";

const resource = (key) =>
    QUEUE_RESOURCE_COLUMNS.find((item) => item.key === key);

const queue = {
    spec: {
        capability: {
            cpu: "8",
            memory: "1Ti",
            pods: "10",
        },
    },
    summary: {
        schedulerMetrics: {
            cpu: {
                allocatedMilli: 3000,
                deservedMilli: 4000,
                requestedMilli: 2000,
            },
            memory: {
                allocatedBytes: 256 * 1024 * 1024,
                deservedBytes: 512 * 1024 * 1024,
                requestedBytes: 128 * 1024 * 1024,
            },
            scalar: {
                pods: {
                    allocated: 1,
                    deserved: 2,
                    requested: 1,
                },
            },
        },
    },
};

describe("queue resource usage", () => {
    it("formats scheduler metric values", () => {
        expect(formatCpuFromMilli(100)).toBe("0.1 cores");
        expect(formatMemoryBytes(67108864)).toBe("64 MiB");
        expect(formatShare(1)).toBe("100%");
    });

    it("builds reusable CPU, memory, and pods usage items", () => {
        const items = getQueueResourceStatusItems(queue);

        expect(items).toHaveLength(3);
        expect(items.map((item) => item.resource.key)).toEqual([
            "cpu",
            "memory",
            "pods",
        ]);
        expect(items[0].stats.usageLabel).toBe("75%");
        expect(items[0].valueText).toBe("3 cores / 4 cores (75%)");
        expect(items[1].stats.usageLabel).toBe("50%");
        expect(items[1].valueText).toBe("256 MiB / 512 MiB (50%)");
        expect(items[2].stats.usageLabel).toBe("50%");
    });

    it("marks allocation above capability as hot", () => {
        const stats = getQueueResourceStats(
            {
                spec: { capability: { cpu: "2" } },
                summary: {
                    schedulerMetrics: {
                        cpu: {
                            allocatedMilli: 3000,
                            deservedMilli: 2000,
                            requestedMilli: 2000,
                        },
                    },
                },
            },
            resource("cpu"),
        );

        expect(stats.overCapability).toBe(true);
        expect(stats.usageTone).toBe("hot");
        expect(stats.usageLabel).toBe("150%");
        expect(stats.usedPercent).toBe(100);
    });

    it("summarizes aggregate queue allocation from scheduler metrics", () => {
        const summary = getQueueUsageSummary(queue);

        expect(summary.usagePercent).toBe(50);
    });
});
