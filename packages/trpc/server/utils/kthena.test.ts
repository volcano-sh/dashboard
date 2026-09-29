import { describe, expect, it, vi } from "vitest";

import {
    getKthenaResource,
    isCrdUnavailableError,
    KTHENA_RESOURCES,
    listKthenaResources,
    mergeCrdReplacePayload,
    validateKthenaManifest,
} from "./kthena";

const modelServing = KTHENA_RESOURCES.modelServing;

function crdMissingError() {
    return {
        code: 404,
        body: {
            reason: "NotFound",
            message: "the server could not find the requested resource",
            details: {},
        },
    };
}

function resourceMissingError(name: string) {
    return {
        code: 404,
        body: {
            reason: "NotFound",
            message: `modelservings.workload.serving.volcano.sh "${name}" not found`,
            details: { name, kind: "modelservings" },
        },
    };
}

describe("KTHENA_RESOURCES", () => {
    it("defines ModelServing on the workload serving API", () => {
        expect(modelServing).toEqual({
            group: "workload.serving.volcano.sh",
            version: "v1alpha1",
            plural: "modelservings",
            kind: "ModelServing",
        });
    });
});

describe("isCrdUnavailableError", () => {
    it("treats a 404 without a resource name as a missing CRD", () => {
        expect(isCrdUnavailableError(crdMissingError())).toBe(true);
    });

    it("does not treat a named resource 404 as a missing CRD", () => {
        expect(isCrdUnavailableError(resourceMissingError("demo"))).toBe(false);
    });

    it("ignores non-404 errors", () => {
        expect(isCrdUnavailableError({ code: 403, body: { reason: "Forbidden" } })).toBe(
            false,
        );
        expect(isCrdUnavailableError(new Error("boom"))).toBe(false);
    });
});

describe("listKthenaResources", () => {
    it("returns page items when the CRD is installed", async () => {
        const item = { metadata: { name: "ms-1", namespace: "default" } };
        const api = {
            listClusterCustomObject: vi.fn().mockResolvedValue({
                items: [item],
                metadata: {},
            }),
        };

        const result = await listKthenaResources(api, modelServing, 1, 10);

        expect(result.crdAvailable).toBe(true);
        expect(result.items).toEqual([item]);
        expect(result.total).toBe(1);
        expect(api.listClusterCustomObject).toHaveBeenCalledWith(
            expect.objectContaining({
                group: "workload.serving.volcano.sh",
                version: "v1alpha1",
                plural: "modelservings",
            }),
        );
    });

    it("returns an empty list when the CRD is not installed", async () => {
        const api = {
            listClusterCustomObject: vi.fn().mockRejectedValue(crdMissingError()),
        };

        const result = await listKthenaResources(api, modelServing, 1, 10);

        expect(result).toMatchObject({
            crdAvailable: false,
            items: [],
            total: 0,
            page: 1,
            pageSize: 10,
        });
    });

    it("rethrows unexpected list errors", async () => {
        const api = {
            listClusterCustomObject: vi.fn().mockRejectedValue(new Error("timeout")),
        };

        await expect(listKthenaResources(api, modelServing, 1, 10)).rejects.toThrow(
            "timeout",
        );
    });
});

describe("getKthenaResource", () => {
    it("returns the object when the CRD is installed", async () => {
        const item = { metadata: { name: "ms-1", namespace: "default" } };
        const api = {
            getNamespacedCustomObject: vi.fn().mockResolvedValue(item),
        };

        const result = await getKthenaResource(api, modelServing, "default", "ms-1");

        expect(result).toEqual({ crdAvailable: true, item });
        expect(api.getNamespacedCustomObject).toHaveBeenCalledWith({
            group: "workload.serving.volcano.sh",
            version: "v1alpha1",
            namespace: "default",
            plural: "modelservings",
            name: "ms-1",
        });
    });

    it("returns crdAvailable false when the CRD is not installed", async () => {
        const api = {
            getNamespacedCustomObject: vi.fn().mockRejectedValue(crdMissingError()),
        };

        await expect(
            getKthenaResource(api, modelServing, "default", "ms-1"),
        ).resolves.toEqual({ crdAvailable: false, item: null });
    });

    it("throws when the named resource is missing", async () => {
        const api = {
            getNamespacedCustomObject: vi
                .fn()
                .mockRejectedValue(resourceMissingError("ms-1")),
        };

        await expect(
            getKthenaResource(api, modelServing, "default", "ms-1"),
        ).rejects.toMatchObject({ code: 404 });
    });
});

describe("mergeCrdReplacePayload", () => {
    it("keeps server metadata and status while applying spec and labels from the patch", () => {
        const current = {
            apiVersion: "workload.serving.volcano.sh/v1alpha1",
            kind: "ModelServing",
            metadata: {
                name: "ms-1",
                namespace: "default",
                uid: "uid-1",
                resourceVersion: "42",
                creationTimestamp: "2026-01-01T00:00:00Z",
                labels: { old: "yes" },
                annotations: { keep: "me" },
            },
            spec: { replicas: 1 },
            status: { replicas: 1, availableReplicas: 1 },
        };
        const patch = {
            apiVersion: "workload.serving.volcano.sh/v1alpha1",
            kind: "ModelServing",
            metadata: {
                name: "ms-1",
                namespace: "default",
                labels: { new: "yes" },
            },
            spec: { replicas: 3 },
        };

        expect(mergeCrdReplacePayload(current, patch)).toEqual({
            apiVersion: "workload.serving.volcano.sh/v1alpha1",
            kind: "ModelServing",
            metadata: {
                name: "ms-1",
                namespace: "default",
                uid: "uid-1",
                resourceVersion: "42",
                creationTimestamp: "2026-01-01T00:00:00Z",
                labels: { new: "yes" },
                annotations: { keep: "me" },
            },
            spec: { replicas: 3 },
            status: { replicas: 1, availableReplicas: 1 },
        });
    });
});

describe("validateKthenaManifest", () => {
    const validManifest = {
        apiVersion: "workload.serving.volcano.sh/v1alpha1",
        kind: "ModelServing",
        metadata: { name: "ms-1", namespace: "default" },
        spec: { replicas: 1, template: {} },
    };

    it("accepts a ModelServing with kind, apiVersion, name, and spec", () => {
        expect(validateKthenaManifest(validManifest, modelServing)).toBeNull();
    });

    it("rejects the wrong kind", () => {
        expect(
            validateKthenaManifest({ ...validManifest, kind: "Job" }, modelServing),
        ).toBe('kind must be "ModelServing"');
    });

    it("rejects the wrong apiVersion", () => {
        expect(
            validateKthenaManifest(
                { ...validManifest, apiVersion: "batch.volcano.sh/v1alpha1" },
                modelServing,
            ),
        ).toBe('apiVersion must be "workload.serving.volcano.sh/v1alpha1"');
    });

    it("rejects a missing name", () => {
        expect(
            validateKthenaManifest(
                { ...validManifest, metadata: { namespace: "default" } },
                modelServing,
            ),
        ).toBe("metadata.name is required");
    });

    it("rejects a missing spec", () => {
        expect(
            validateKthenaManifest(
                {
                    apiVersion: "workload.serving.volcano.sh/v1alpha1",
                    kind: "ModelServing",
                    metadata: { name: "ms-1", namespace: "default" },
                },
                modelServing,
            ),
        ).toBe("spec is required");
    });
});
