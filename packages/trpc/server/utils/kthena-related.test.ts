import { describe, expect, it } from "vitest";

import {
    extractQueueName,
    isOwnedByModelServing,
    matchesModelServingLabel,
    modelServingLabelSelector,
    resolveModelServingRelated,
} from "./kthena-related";

describe("modelServingLabelSelector", () => {
    it("builds the Kthena name label selector", () => {
        expect(modelServingLabelSelector("ms-1")).toBe(
            "modelserving.volcano.sh/name=ms-1",
        );
    });
});

describe("extractQueueName", () => {
    it("reads the Volcano queue annotation", () => {
        expect(
            extractQueueName({
                metadata: {
                    annotations: { "scheduling.volcano.sh/queue-name": "inference" },
                },
            }),
        ).toBe("inference");
    });

    it("returns null when the annotation is missing", () => {
        expect(extractQueueName({ metadata: { name: "ms-1" } })).toBeNull();
    });
});

describe("matchesModelServingLabel", () => {
    it("matches pods labeled with the ModelServing name", () => {
        expect(
            matchesModelServingLabel(
                { metadata: { labels: { "modelserving.volcano.sh/name": "ms-1" } } },
                "ms-1",
            ),
        ).toBe(true);
    });

    it("rejects a different ModelServing name", () => {
        expect(
            matchesModelServingLabel(
                { metadata: { labels: { "modelserving.volcano.sh/name": "other" } } },
                "ms-1",
            ),
        ).toBe(false);
    });
});

describe("isOwnedByModelServing", () => {
    it("matches ownerReferences for this ModelServing", () => {
        expect(
            isOwnedByModelServing(
                {
                    metadata: {
                        ownerReferences: [{ kind: "ModelServing", name: "ms-1" }],
                    },
                },
                "ms-1",
            ),
        ).toBe(true);
    });
});

describe("resolveModelServingRelated", () => {
    it("returns empty related lists when nothing matches", () => {
        expect(
            resolveModelServingRelated({ namespace: "ns1", name: "ms-1" }),
        ).toEqual({
            pods: [],
            podGroups: [],
            queue: null,
        });
    });

    it("collects labeled pods, owned pod groups, and the queue annotation", () => {
        expect(
            resolveModelServingRelated({
                namespace: "ns1",
                name: "ms-1",
                modelServing: {
                    metadata: {
                        annotations: { "scheduling.volcano.sh/queue-name": "inference" },
                    },
                },
                pods: [
                    {
                        metadata: {
                            name: "pod-a",
                            namespace: "ns1",
                            labels: { "modelserving.volcano.sh/name": "ms-1" },
                        },
                    },
                    {
                        metadata: {
                            name: "pod-other",
                            labels: { "modelserving.volcano.sh/name": "other" },
                        },
                    },
                ],
                podGroups: [
                    {
                        metadata: {
                            name: "pg-a",
                            namespace: "ns1",
                            ownerReferences: [{ kind: "ModelServing", name: "ms-1" }],
                        },
                    },
                ],
            }),
        ).toEqual({
            pods: [{ name: "pod-a", namespace: "ns1" }],
            podGroups: [{ name: "pg-a", namespace: "ns1" }],
            queue: "inference",
        });
    });
});
