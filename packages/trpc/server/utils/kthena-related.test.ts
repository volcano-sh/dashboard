import { describe, expect, it } from "vitest";

import {
    extractQueueName,
    isOwnedByModelServing,
    matchesModelServingLabel,
    modelServingLabelSelector,
    resolveModelBoosterRelated,
    resolveModelRouteRelated,
    resolveModelServerRelated,
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
            owner: null,
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
            owner: null,
        });
    });

    it("includes the owning ModelBooster", () => {
        expect(
            resolveModelServingRelated({
                namespace: "ns1",
                name: "ms-1",
                modelServing: {
                    metadata: {
                        namespace: "ns1",
                        ownerReferences: [{ kind: "ModelBooster", name: "demo" }],
                    },
                },
            }).owner,
        ).toEqual({ name: "demo", namespace: "ns1" });
    });
});

describe("resolveModelBoosterRelated", () => {
    it("keeps only children owned by this booster", () => {
        expect(
            resolveModelBoosterRelated({
                namespace: "ns1",
                name: "demo",
                modelServings: [
                    {
                        metadata: {
                            name: "ms-1",
                            ownerReferences: [{ kind: "ModelBooster", name: "demo" }],
                        },
                    },
                    {
                        metadata: {
                            name: "ms-other",
                            ownerReferences: [{ kind: "ModelBooster", name: "other" }],
                        },
                    },
                ],
                modelServers: [
                    {
                        metadata: {
                            name: "srv-1",
                            ownerReferences: [{ kind: "ModelBooster", name: "demo" }],
                        },
                    },
                ],
                modelRoutes: [],
            }),
        ).toEqual({
            modelServings: [{ name: "ms-1", namespace: "ns1" }],
            modelServers: [{ name: "srv-1", namespace: "ns1" }],
            modelRoutes: [],
        });
    });
});

describe("resolveModelServerRelated", () => {
    it("matches pods by workloadSelector and routes that target this server", () => {
        expect(
            resolveModelServerRelated({
                namespace: "ns1",
                name: "srv-1",
                modelServer: {
                    spec: { workloadSelector: { matchLabels: { app: "vllm" } } },
                },
                pods: [
                    { metadata: { name: "pod-a", labels: { app: "vllm" } } },
                    { metadata: { name: "pod-b", labels: { app: "other" } } },
                ],
                modelRoutes: [
                    {
                        metadata: { name: "route-a" },
                        spec: {
                            rules: [{ targetModels: [{ modelServerName: "srv-1" }] }],
                        },
                    },
                    {
                        metadata: { name: "route-b" },
                        spec: {
                            rules: [{ targetModels: [{ modelServerName: "other" }] }],
                        },
                    },
                ],
            }),
        ).toEqual({
            pods: [{ name: "pod-a", namespace: "ns1" }],
            modelRoutes: [{ name: "route-a", namespace: "ns1" }],
        });
    });
});

describe("resolveModelRouteRelated", () => {
    it("lists target ModelServers and parentRefs as text", () => {
        expect(
            resolveModelRouteRelated({
                namespace: "ns1",
                modelRoute: {
                    spec: {
                        parentRefs: [{ kind: "Gateway", name: "kthena-gw", namespace: "ns1" }],
                        rules: [
                            {
                                targetModels: [
                                    { modelServerName: "srv-1" },
                                    { externalModelProviderName: "ext" },
                                ],
                            },
                        ],
                    },
                },
            }),
        ).toEqual({
            modelServers: [{ name: "srv-1", namespace: "ns1" }],
            parentRefs: ["Gateway ns1/kthena-gw"],
        });
    });
});
