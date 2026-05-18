interface K8sStatusBody {
    message?: string;
    reason?: string;
    details?: { name?: string; kind?: string };
    code?: number;
}

function parseK8sStatusBody(body: unknown): K8sStatusBody | null {
    if (!body) return null;
    if (typeof body === "object") return body as K8sStatusBody;
    if (typeof body === "string") {
        try {
            return JSON.parse(body) as K8sStatusBody;
        } catch {
            return null;
        }
    }
    return null;
}

function isApiException(error: unknown): error is { code: number; body: unknown } {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "number"
    );
}

/** Parse Volcano validatequeue webhook constraint messages into plain language. */
function formatVolcanoQueueConstraint(message: string): string | null {
    const capLte = message.match(
        /deserved\[(\w+)\]=([^:]+?)\s+must be\s*<=\s*capability\[\1\]=(\S+)/i
    );
    if (capLte) {
        const resource = capLte[1]!.toLowerCase();
        const deservedVal = capLte[2]!.trim();
        const capVal = capLte[3]!.trim();
        return `Deserved ${resource} (${deservedVal}) must be less than or equal to capability ${resource} (${capVal}). Increase capability or lower deserved.`;
    }

    const guarGte = message.match(
        /deserved\[(\w+)\][^=]*=\s*[^:]*:\s*deserved\[\1\][^=]*=\s*[^,]+,\s*.*?guarantee\[\1\]=(\S+)/i
    );
    if (guarGte) {
        const resource = guarGte[1]!.toLowerCase();
        const guarVal = guarGte[2]!.trim();
        return `Deserved ${resource} must be greater than or equal to guarantee ${resource} (${guarVal}).`;
    }

    const guarGteSimple = message.match(
        /deserved\[(\w+)\].*must be\s*>=\s*guarantee\[\1\]=(\S+)/i
    );
    if (guarGteSimple) {
        const resource = guarGteSimple[1]!.toLowerCase();
        const guarVal = guarGteSimple[2]!.trim();
        return `Deserved ${resource} must be greater than or equal to guarantee ${resource} (${guarVal}).`;
    }

    if (message.includes("deserved") && message.includes("capability") && message.includes("<=")) {
        return "Deserved resources must be less than or equal to capability resources (CPU and memory).";
    }

    if (message.includes("deserved") && message.includes("guarantee")) {
        return "Deserved resources must be greater than or equal to guarantee resources (CPU and memory).";
    }

    if (
        message.includes("VolumeClaim") &&
        message.includes("VolumeClaimName") &&
        message.includes("must be specified")
    ) {
        return "Each volume entry must include either volumeClaim (inline PVC spec) or volumeClaimName (existing PVC). Remove empty volume entries or add a claim.";
    }

    return null;
}

function formatAdmissionWebhookMessage(message: string): string {
    const deniedPrefix = /admission webhook[^:]*denied the request:\s*/i;
    let detail = message.replace(deniedPrefix, "").trim();

    // Strip wrapping brackets from batched errors: [err1, err2]
    if (detail.startsWith("[") && detail.endsWith("]")) {
        detail = detail.slice(1, -1);
    }

    const parts = detail.split(/,\s*(?=requestBody\.|deserved\[)/);
    const formatted = parts
        .map((part) => formatVolcanoQueueConstraint(part.trim()) ?? part.trim())
        .filter(Boolean);

    if (formatted.length > 0) {
        return formatted.join(" ");
    }

    return message;
}

/** Turn Kubernetes client ApiException errors into short, user-facing messages. */
export function formatK8sApiError(error: unknown): string {
    if (!isApiException(error)) {
        return error instanceof Error ? error.message : "An unexpected error occurred";
    }

    const status = parseK8sStatusBody(error.body);
    const resourceName = status?.details?.name;
    const resourceKind = status?.details?.kind?.toLowerCase() ?? "resource";

    if (error.code === 409 && status?.reason === "AlreadyExists") {
        if (resourceName) {
            return `A ${resourceKind} named "${resourceName}" already exists. Choose a different name or delete the existing one.`;
        }
        return status?.message ?? "This resource already exists.";
    }

    if (error.code === 404) {
        if (resourceName) {
            return `${resourceKind} "${resourceName}" was not found.`;
        }
        return status?.message ?? "Resource not found.";
    }

    if (status?.message) {
        if (status.message.includes("admission webhook") || status.message.includes("deserved[")) {
            return formatAdmissionWebhookMessage(status.message);
        }
        return status.message;
    }

    return error instanceof Error ? error.message : "Kubernetes API request failed";
}
