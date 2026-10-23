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

export function modelServingLabelSelector(name: string): string {
    return `${MODEL_SERVING_NAME_LABEL}=${name}`;
}

export function extractQueueName(item: NamedObject): string | null {
    const queue = item.metadata?.annotations?.[QUEUE_NAME_ANNOTATION];
    return queue ? queue : null;
}

export function matchesModelServingLabel(item: NamedObject, name: string): boolean {
    return item.metadata?.labels?.[MODEL_SERVING_NAME_LABEL] === name;
}

export function isOwnedByModelServing(item: NamedObject, name: string): boolean {
    return (item.metadata?.ownerReferences ?? []).some(
        (ref) => ref.kind === "ModelServing" && ref.name === name,
    );
}

function asNamedObject(item: unknown): NamedObject | null {
    if (!item || typeof item !== "object") {
        return null;
    }
    return item as NamedObject;
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
    const pods = (args.pods ?? []).map(asNamedObject).filter((item): item is NamedObject => item !== null);
    const podGroups = (args.podGroups ?? [])
        .map(asNamedObject)
        .filter((item): item is NamedObject => item !== null);

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
    };
}
