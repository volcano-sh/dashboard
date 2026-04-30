import { describe, expect, it } from "vitest";
import {
    buildQueueHealth,
    buildPodDistribution,
    classifyQueue,
    formatLatency,
} from "../components/overview/overviewUtils";

const queueWithMetrics = (schedulerMetrics) => ({
    summary: {
        schedulerMetrics,
    },
});

describe("overview utils", () => {
    it("formats scheduler latency values", () => {
        expect(formatLatency(250.5)).toBe("250.5 ms");
        expect(formatLatency(1200)).toBe("1.2 s");
        expect(formatLatency(null)).toBe("-");
    });

    it("classifies queue health from scheduler and PodGroup metrics", () => {
        expect(
            classifyQueue(
                queueWithMetrics({
                    cpu: { allocatedMilli: 0, requestedMilli: 0 },
                    memory: { allocatedBytes: 0, requestedBytes: 0 },
                    podGroups: { inqueue: 0, pending: 0, running: 0 },
                    scheduling: {},
                }),
            ),
        ).toBe("Idle");
        expect(
            classifyQueue(
                queueWithMetrics({
                    cpu: { allocatedMilli: 0, requestedMilli: 100 },
                    memory: { allocatedBytes: 0, requestedBytes: 100 },
                    podGroups: { inqueue: 1, pending: 0, running: 0 },
                    scheduling: {},
                }),
            ),
        ).toBe("Starving");
        expect(
            classifyQueue(
                queueWithMetrics({
                    cpu: { allocatedMilli: 100, requestedMilli: 100 },
                    memory: { allocatedBytes: 100, requestedBytes: 100 },
                    podGroups: { inqueue: 1, pending: 0, running: 1 },
                    scheduling: {},
                }),
            ),
        ).toBe("Busy");
        expect(
            classifyQueue(
                queueWithMetrics({
                    podGroups: { inqueue: 0, pending: 0, running: 1 },
                    scheduling: { overused: true },
                }),
            ),
        ).toBe("Overused");
    });

    it("builds pod status distribution from pod phases", () => {
        expect(
            buildPodDistribution([
                { summary: { status: "Running" } },
                { status: { phase: "Pending" } },
                { status: { phase: "Succeeded" } },
                { status: { phase: "Failed" } },
            ]).map(({ label, value }) => ({ label, value })),
        ).toEqual([
            { label: "Running", value: 1 },
            { label: "Pending", value: 1 },
            { label: "Succeeded", value: 1 },
            { label: "Failed", value: 1 },
        ]);
    });

    it("aggregates queue health into overview categories", () => {
        const health = buildQueueHealth([
            queueWithMetrics({
                podGroups: { inqueue: 0, pending: 0, running: 1 },
                scheduling: {},
            }),
            queueWithMetrics({
                cpu: { allocatedMilli: 100, requestedMilli: 100 },
                memory: { allocatedBytes: 100, requestedBytes: 100 },
                podGroups: { inqueue: 1, pending: 0, running: 1 },
                scheduling: {},
            }),
            queueWithMetrics({
                podGroups: { inqueue: 0, pending: 0, running: 1 },
                scheduling: { overused: true },
            }),
            queueWithMetrics({
                cpu: { allocatedMilli: 0, requestedMilli: 100 },
                memory: { allocatedBytes: 0, requestedBytes: 100 },
                podGroups: { inqueue: 1, pending: 0, running: 0 },
                scheduling: {},
            }),
        ]);

        expect(health.map(({ label, value }) => ({ label, value }))).toEqual([
            { label: "Healthy", value: 1 },
            { label: "Degraded", value: 1 },
            { label: "Overused", value: 1 },
            { label: "Starving", value: 1 },
        ]);
    });
});
