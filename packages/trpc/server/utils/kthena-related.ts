export const MODEL_SERVING_NAME_LABEL = "modelserving.volcano.sh/name";
export const QUEUE_NAME_ANNOTATION = "scheduling.volcano.sh/queue-name";

export type RelatedRef = {
    name: string;
    namespace: string;
};

export type ModelServingRelated = {
    pods: RelatedRef[];
    podGroups: RelatedRef[];
    queue: string | null;
    owner: RelatedRef | null;
};

export type ModelBoosterRelated = {
    modelServings: RelatedRef[];
    modelServers: RelatedRef[];
    modelRoutes: RelatedRef[];
};

export type ModelServerRelated = {
    pods: RelatedRef[];
    modelRoutes: RelatedRef[];
};

export type ModelRouteRelated = {
    modelServers: RelatedRef[];
    parentRefs: string[];
};

type OwnerRef = {
    kind?: string;
    name?: string;
};

type NamedObject = {
    metadata?: {
        name?: string;
        namespace?: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
        ownerReferences?: OwnerRef[];
    };
    spec?: unknown;
};

function namedRef(item: NamedObject, fallbackNamespace: string): RelatedRef | null {
    const name = item.metadata?.name;
    if (!name) {
        return null;
    }
    return {
        name,
        namespace: item.metadata?.namespace || fallbackNamespace,
    };
}

function asNamedObject(item: unknown): NamedObject | null {
    if (!item || typeof item !== "object") {
        return null;
    }
    return item as NamedObject;
}

function namedObjects(items: unknown[] | undefined): NamedObject[] {
    return (items ?? []).map(asNamedObject).filter((item): item is NamedObject => item !== null);
}

export function modelServingLabelSelector(name: string): string {
    return `${MODEL_SERVING_NAME_LABEL}=${name}`;
}

export function matchLabelsSelector(labels: Record<string, string> | undefined): string {
    if (!labels) {
        return "";
    }
    return Object.entries(labels)
        .map(([key, value]) => `${key}=${value}`)
        .join(",");
}

export function extractQueueName(item: NamedObject): string | null {
    const queue = item.metadata?.annotations?.[QUEUE_NAME_ANNOTATION];
    return queue ? queue : null;
}

export function matchesModelServingLabel(item: NamedObject, name: string): boolean {
    return item.metadata?.labels?.[MODEL_SERVING_NAME_LABEL] === name;
}

export function isOwnedBy(item: NamedObject, kind: string, name: string): boolean {
    return (item.metadata?.ownerReferences ?? []).some(
        (ref) => ref.kind === kind && ref.name === name,
    );
}

export function isOwnedByModelServing(item: NamedObject, name: string): boolean {
    return isOwnedBy(item, "ModelServing", name);
}

export function extractOwnerRef(
    item: unknown,
    kind: string,
    fallbackNamespace: string,
): RelatedRef | null {
    const named = asNamedObject(item);
    const owner = (named?.metadata?.ownerReferences ?? []).find((ref) => ref.kind === kind && ref.name);
    if (!owner?.name) {
        return null;
    }
    return {
        name: owner.name,
        namespace: named?.metadata?.namespace || fallbackNamespace,
    };
}

export function extractModelServerNames(route: unknown): string[] {
    const spec = asNamedObject(route)?.spec as {
        rules?: { targetModels?: { modelServerName?: string }[] }[];
    } | undefined;
    const names = new Set<string>();
    for (const rule of spec?.rules ?? []) {
        for (const target of rule.targetModels ?? []) {
            if (target.modelServerName) {
                names.add(target.modelServerName);
            }
        }
    }
    return Array.from(names);
}

export function extractParentRefs(route: unknown): string[] {
    const spec = asNamedObject(route)?.spec as {
        parentRefs?: { name?: string; namespace?: string; kind?: string }[];
    } | undefined;
    return (spec?.parentRefs ?? [])
        .map((ref) => {
            const kind = ref.kind || "Gateway";
            const ns = ref.namespace ? `${ref.namespace}/` : "";
            return ref.name ? `${kind} ${ns}${ref.name}` : "";
        })
        .filter(Boolean);
}

export function extractWorkloadMatchLabels(server: unknown): Record<string, string> | undefined {
    const spec = asNamedObject(server)?.spec as {
        workloadSelector?: { matchLabels?: Record<string, string> };
    } | undefined;
    return spec?.workloadSelector?.matchLabels;
}

export function resolveModelServingRelated(args: {
    namespace: string;
    name: string;
    modelServing?: unknown;
    pods?: unknown[];
    podGroups?: unknown[];
}): ModelServingRelated {
    const { namespace, name } = args;
    const modelServing = asNamedObject(args.modelServing);
    const pods = namedObjects(args.pods);
    const podGroups = namedObjects(args.podGroups);

    const podRefs = pods
        .filter((pod) => matchesModelServingLabel(pod, name) || isOwnedByModelServing(pod, name))
        .map((pod) => namedRef(pod, namespace))
        .filter((ref): ref is RelatedRef => ref !== null);

    const podGroupRefs = podGroups
        .filter(
            (pg) => matchesModelServingLabel(pg, name) || isOwnedByModelServing(pg, name),
        )
        .map((pg) => namedRef(pg, namespace))
        .filter((ref): ref is RelatedRef => ref !== null);

    return {
        pods: podRefs,
        podGroups: podGroupRefs,
        queue: modelServing ? extractQueueName(modelServing) : null,
        owner: extractOwnerRef(args.modelServing, "ModelBooster", namespace),
    };
}

export function resolveModelBoosterRelated(args: {
    namespace: string;
    name: string;
    modelServings?: unknown[];
    modelServers?: unknown[];
    modelRoutes?: unknown[];
}): ModelBoosterRelated {
    const owned = (items: unknown[]) =>
        namedObjects(items)
            .filter((item) => isOwnedBy(item, "ModelBooster", args.name))
            .map((item) => namedRef(item, args.namespace))
            .filter((ref): ref is RelatedRef => ref !== null);

    return {
        modelServings: owned(args.modelServings ?? []),
        modelServers: owned(args.modelServers ?? []),
        modelRoutes: owned(args.modelRoutes ?? []),
    };
}

export function resolveModelServerRelated(args: {
    namespace: string;
    name: string;
    modelServer?: unknown;
    pods?: unknown[];
    modelRoutes?: unknown[];
}): ModelServerRelated {
    const labels = extractWorkloadMatchLabels(args.modelServer);
    const pods = namedObjects(args.pods).filter((pod) => {
        if (!labels || Object.keys(labels).length === 0) {
            return false;
        }
        return Object.entries(labels).every(
            ([key, value]) => pod.metadata?.labels?.[key] === value,
        );
    });

    const routes = namedObjects(args.modelRoutes).filter((route) =>
        extractModelServerNames(route).includes(args.name),
    );

    return {
        pods: pods
            .map((pod) => namedRef(pod, args.namespace))
            .filter((ref): ref is RelatedRef => ref !== null),
        modelRoutes: routes
            .map((route) => namedRef(route, args.namespace))
            .filter((ref): ref is RelatedRef => ref !== null),
    };
}

export function resolveModelRouteRelated(args: {
    namespace: string;
    modelRoute?: unknown;
}): ModelRouteRelated {
    return {
        modelServers: extractModelServerNames(args.modelRoute).map((name) => ({
            name,
            namespace: args.namespace,
        })),
        parentRefs: extractParentRefs(args.modelRoute),
    };
}
