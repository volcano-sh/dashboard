import { extractListMeta, fetchPaginatedK8sList } from "../router/helpers";
import { buildPaginatedResponse, type PaginatedResponse } from "../router/pagination";

export type KthenaResourceDef = {
    group: string;
    version: string;
    plural: string;
    kind: string;
};

export const KTHENA_RESOURCES = {
    modelServing: {
        group: "workload.serving.volcano.sh",
        version: "v1alpha1",
        plural: "modelservings",
        kind: "ModelServing",
    },
    modelBooster: {
        group: "workload.serving.volcano.sh",
        version: "v1alpha1",
        plural: "modelboosters",
        kind: "ModelBooster",
    },
    modelRoute: {
        group: "networking.serving.volcano.sh",
        version: "v1alpha1",
        plural: "modelroutes",
        kind: "ModelRoute",
    },
    modelServer: {
        group: "networking.serving.volcano.sh",
        version: "v1alpha1",
        plural: "modelservers",
        kind: "ModelServer",
    },
} as const satisfies Record<string, KthenaResourceDef>;

export type KthenaListResult<T = unknown> = PaginatedResponse<T> & {
    crdAvailable: boolean;
};

export type KthenaGetResult<T = unknown> =
    | { crdAvailable: true; item: T }
    | { crdAvailable: false; item: null };

type ApiExceptionLike = { code: number; body: unknown };

type ClusterListApi = {
    listClusterCustomObject: (args: {
        group: string;
        version: string;
        plural: string;
        limit?: number;
        continue?: string;
    }) => Promise<{
        items?: unknown[];
        metadata?: { _continue?: string; remainingItemCount?: number };
    }>;
};

type NamespacedGetApi = {
    getNamespacedCustomObject: (args: {
        group: string;
        version: string;
        namespace: string;
        plural: string;
        name: string;
    }) => Promise<unknown>;
};

type NamespacedWriteApi = NamespacedGetApi & {
    createNamespacedCustomObject: (args: {
        group: string;
        version: string;
        namespace: string;
        plural: string;
        body: unknown;
    }) => Promise<unknown>;
    replaceNamespacedCustomObject: (args: {
        group: string;
        version: string;
        namespace: string;
        plural: string;
        name: string;
        body: unknown;
    }) => Promise<unknown>;
    deleteNamespacedCustomObject: (args: {
        group: string;
        version: string;
        namespace: string;
        plural: string;
        name: string;
        body?: { propagationPolicy?: string };
    }) => Promise<unknown>;
};

type K8sStatusBody = {
    details?: { name?: string };
};

function isApiException(error: unknown): error is ApiExceptionLike {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "number"
    );
}

function parseK8sStatusBody(body: unknown): K8sStatusBody | null {
    if (!body) {
        return null;
    }
    if (typeof body === "object") {
        return body as K8sStatusBody;
    }
    if (typeof body === "string") {
        try {
            return JSON.parse(body) as K8sStatusBody;
        } catch {
            return null;
        }
    }
    return null;
}

export function isCrdUnavailableError(error: unknown): boolean {
    if (!isApiException(error) || error.code !== 404) {
        return false;
    }
    const status = parseK8sStatusBody(error.body);
    return !status?.details?.name;
}

export async function listKthenaResources(
    api: ClusterListApi,
    resource: KthenaResourceDef,
    page: number,
    pageSize: number,
): Promise<KthenaListResult> {
    try {
        const result = await fetchPaginatedK8sList(
            page,
            pageSize,
            async (limit, continueToken) => {
                const response = await api.listClusterCustomObject({
                    group: resource.group,
                    version: resource.version,
                    plural: resource.plural,
                    limit,
                    ...(continueToken && { continue: continueToken }),
                });
                return extractListMeta(response);
            },
        );
        return { ...result, crdAvailable: true };
    } catch (error) {
        if (isCrdUnavailableError(error)) {
            return {
                ...buildPaginatedResponse([], page, pageSize, 0),
                crdAvailable: false,
            };
        }
        throw error;
    }
}

export async function getKthenaResource(
    api: NamespacedGetApi,
    resource: KthenaResourceDef,
    namespace: string,
    name: string,
): Promise<KthenaGetResult> {
    try {
        const item = await api.getNamespacedCustomObject({
            group: resource.group,
            version: resource.version,
            namespace,
            plural: resource.plural,
            name,
        });
        return { crdAvailable: true, item };
    } catch (error) {
        if (isCrdUnavailableError(error)) {
            return { crdAvailable: false, item: null };
        }
        throw error;
    }
}

type CrdMetadata = {
    name?: string;
    namespace?: string;
    uid?: unknown;
    resourceVersion?: unknown;
    creationTimestamp?: unknown;
    labels?: unknown;
    annotations?: unknown;
};

type CrdObject = {
    apiVersion?: string;
    kind?: string;
    metadata?: CrdMetadata;
    spec?: unknown;
    status?: unknown;
};

type CrdPatch = {
    apiVersion?: string;
    kind?: string;
    metadata?: {
        name: string;
        namespace?: string;
        labels?: unknown;
        annotations?: unknown;
    };
    spec: unknown;
};

export function mergeCrdReplacePayload(current: CrdObject, patch: CrdPatch): CrdObject {
    return {
        apiVersion: patch.apiVersion || current.apiVersion,
        kind: patch.kind || current.kind,
        metadata: {
            ...current.metadata,
            labels: patch.metadata?.labels ?? current.metadata?.labels,
            annotations: patch.metadata?.annotations ?? current.metadata?.annotations,
            name: current.metadata?.name,
            namespace: current.metadata?.namespace,
            resourceVersion: current.metadata?.resourceVersion,
            uid: current.metadata?.uid,
            creationTimestamp: current.metadata?.creationTimestamp,
        },
        spec: patch.spec,
        status: current.status,
    };
}

export function validateKthenaManifest(
    manifest: Record<string, unknown>,
    resource: KthenaResourceDef,
): string | null {
    const expectedApiVersion = `${resource.group}/${resource.version}`;

    if (manifest.kind !== resource.kind) {
        return `kind must be "${resource.kind}"`;
    }
    if (manifest.apiVersion !== expectedApiVersion) {
        return `apiVersion must be "${expectedApiVersion}"`;
    }

    const metadata = manifest.metadata;
    if (
        !metadata ||
        typeof metadata !== "object" ||
        !("name" in metadata) ||
        typeof metadata.name !== "string" ||
        metadata.name.length === 0
    ) {
        return "metadata.name is required";
    }

    if (!manifest.spec || typeof manifest.spec !== "object") {
        return "spec is required";
    }

    return null;
}

type ModelServingCondition = { type?: string; status?: string };

export type ModelServingSummary = {
    status: "Available" | "Progressing" | "UpdateInProgress" | "Unknown";
    replicas: number;
    availableReplicas: number;
    updatedReplicas: number;
    schedulerName: string;
};

function conditionIsTrue(
    conditions: ModelServingCondition[] | undefined,
    type: string,
): boolean {
    return (conditions ?? []).some(
        (condition) => condition.type === type && condition.status === "True",
    );
}

export function summarizeModelServingStatus(item: {
    spec?: { replicas?: number; schedulerName?: string };
    status?: {
        replicas?: number;
        availableReplicas?: number;
        updatedReplicas?: number;
        conditions?: ModelServingCondition[];
    };
}): ModelServingSummary {
    const conditions = item.status?.conditions;
    let status: ModelServingSummary["status"] = "Unknown";
    if (conditionIsTrue(conditions, "Available")) {
        status = "Available";
    } else if (conditionIsTrue(conditions, "UpdateInProgress")) {
        status = "UpdateInProgress";
    } else if (conditionIsTrue(conditions, "Progressing")) {
        status = "Progressing";
    }

    return {
        status,
        replicas: item.status?.replicas ?? item.spec?.replicas ?? 0,
        availableReplicas: item.status?.availableReplicas ?? 0,
        updatedReplicas: item.status?.updatedReplicas ?? 0,
        schedulerName: item.spec?.schedulerName || "volcano",
    };
}

function metadataName(manifest: Record<string, unknown>): {
    name: string;
    namespace: string;
} {
    const metadata = manifest.metadata as { name?: string; namespace?: string } | undefined;
    return {
        name: metadata?.name ?? "",
        namespace: metadata?.namespace || "default",
    };
}

export async function createKthenaResource(
    api: Pick<NamespacedWriteApi, "createNamespacedCustomObject">,
    resource: KthenaResourceDef,
    manifest: Record<string, unknown>,
): Promise<unknown> {
    const error = validateKthenaManifest(manifest, resource);
    if (error) {
        throw new Error(error);
    }
    const { namespace } = metadataName(manifest);
    return api.createNamespacedCustomObject({
        group: resource.group,
        version: resource.version,
        namespace,
        plural: resource.plural,
        body: manifest,
    });
}

export async function replaceKthenaResource(
    api: NamespacedWriteApi,
    resource: KthenaResourceDef,
    namespace: string,
    name: string,
    patch: Record<string, unknown>,
): Promise<unknown> {
    const error = validateKthenaManifest(patch, resource);
    if (error) {
        throw new Error(error);
    }

    const meta = patch.metadata as { name: string; namespace?: string };
    if (meta.name !== name) {
        throw new Error(
            `name in manifest (${meta.name}) must match path name (${name})`,
        );
    }
    const patchNamespace = meta.namespace ?? namespace;
    if (patchNamespace !== namespace) {
        throw new Error(
            `namespace in manifest (${patchNamespace}) must match path namespace (${namespace})`,
        );
    }

    const current = (await api.getNamespacedCustomObject({
        group: resource.group,
        version: resource.version,
        namespace,
        plural: resource.plural,
        name,
    })) as CrdObject;

    const body = mergeCrdReplacePayload(current, {
        apiVersion: typeof patch.apiVersion === "string" ? patch.apiVersion : undefined,
        kind: typeof patch.kind === "string" ? patch.kind : undefined,
        metadata: meta,
        spec: patch.spec,
    });

    return api.replaceNamespacedCustomObject({
        group: resource.group,
        version: resource.version,
        namespace,
        plural: resource.plural,
        name,
        body,
    });
}

export async function deleteKthenaResource(
    api: Pick<NamespacedWriteApi, "deleteNamespacedCustomObject">,
    resource: KthenaResourceDef,
    namespace: string,
    name: string,
): Promise<unknown> {
    return api.deleteNamespacedCustomObject({
        group: resource.group,
        version: resource.version,
        namespace,
        plural: resource.plural,
        name,
        body: { propagationPolicy: "Foreground" },
    });
}
