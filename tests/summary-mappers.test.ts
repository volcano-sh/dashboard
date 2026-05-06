import { describe, expect, it } from "vitest";
import {
    withJobSummary,
    withPodGroupSummary,
    withPodSummary,
    withQueueSummary,
} from "../lib/server/summary-mappers";

describe("summary mappers", () => {
    it("preserves the raw Kubernetes job object and appends summary fields", () => {
        const job = {
            metadata: {
                name: "train",
                namespace: "ml",
                creationTimestamp: "2026-04-23T01:00:00Z",
            },
            spec: {
                queue: "research",
                tasks: [{ name: "worker" }],
            },
            status: {
                state: { phase: "Running" },
            },
        };

        expect(withJobSummary(job)).toMatchObject({
            metadata: job.metadata,
            spec: job.spec,
            status: job.status,
            summary: {
                name: "train",
                namespace: "ml",
                queue: "research",
                status: "Running",
                createdAt: "2026-04-23T01:00:00Z",
            },
        });
    });

    it("summarizes queue resource usage without dropping raw resource data", () => {
        const queue = {
            metadata: { name: "prod" },
            spec: {
                parent: "root",
                capability: { cpu: "100", memory: "200Gi" },
            },
            status: {
                state: "Open",
                allocated: { cpu: "25", memory: "50Gi" },
                pending: { cpu: "10" },
            },
        };

        const mapped = withQueueSummary(queue);

        expect(mapped.status).toBe(queue.status);
        expect(mapped.summary).toMatchObject({
            name: "prod",
            parent: "root",
            status: "Active",
            usage: { cpu: 25, memory: 25 },
            pending: { cpu: 10 },
        });
    });

    it("adds stable pod and podgroup summary metadata", () => {
        expect(
            withPodSummary({
                metadata: {
                    annotations: {
                        "scheduling.volcano.sh/group-name": "pg-a",
                        "scheduling.volcano.sh/queue-name": "research",
                    },
                    name: "pod-a",
                    namespace: "default",
                },
                spec: { nodeName: "node-1", containers: [{ name: "main" }] },
                status: {
                    phase: "Running",
                    containerStatuses: [{ restartCount: 2 }],
                },
            }).summary,
        ).toMatchObject({
            name: "pod-a",
            namespace: "default",
            status: "Running",
            queue: "research",
            podGroup: "pg-a",
            nodeName: "node-1",
            containers: 1,
            restarts: 2,
        });

        expect(
            withPodGroupSummary({
                metadata: { name: "pg-a", namespace: "default" },
                spec: { queue: "prod", minMember: 2 },
                status: { phase: "Inqueue", running: 1 },
            }).summary,
        ).toMatchObject({
            name: "pg-a",
            namespace: "default",
            queue: "prod",
            status: "Inqueue",
            minMember: 2,
            running: 1,
        });
    });

    it("summarizes pod queue only from Volcano queue annotations", () => {
        expect(
            withPodSummary({
                metadata: {
                    labels: { "volcano.sh/queue": "batch" },
                    name: "pod-b",
                    namespace: "default",
                },
            }).summary.queue,
        ).toBe("");

        expect(
            withPodSummary({
                metadata: {
                    annotations: {
                        "scheduling.volcano.sh/group-name": "pg-c",
                    },
                    name: "pod-c",
                    namespace: "default",
                },
            }).summary.queue,
        ).toBe("");
        expect(
            withPodSummary({
                metadata: {
                    annotations: {
                        "scheduling.volcano.sh/group-name": "pg-c",
                    },
                    name: "pod-c",
                    namespace: "default",
                },
            }).summary.podGroup,
        ).toBe("pg-c");
    });
});
