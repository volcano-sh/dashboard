interface K8sStatusBody {
    message?: string;
    reason?: string;
    details?: { name?: string; kind?: string };
    code?: number;
}

interface ApiExceptionLike {
    code?: number;
    statusCode?: number;
    body?: unknown;
    response?: { statusCode?: number; body?: unknown };
}

export function parseK8sStatusBody(body: unknown): K8sStatusBody | null {
    if (!body) return null;
    if (typeof body === "object") return body as K8sStatusBody;
    if (typeof body === "string") {
        const trimmed = body.trim();
        if (!trimmed) return null;
        try {
            const parsed: unknown = JSON.parse(trimmed);
            if (typeof parsed === "object" && parsed !== null) {
                return parsed as K8sStatusBody;
            }
        } catch {
            return { message: trimmed };
        }
        return { message: trimmed };
    }
    return null;
}

export function getErrorCode(error: unknown): number | null {
    if (typeof error !== "object" || error === null) return null;
    const err = error as ApiExceptionLike;
    if (typeof err.code === "number") return err.code;
    if (typeof err.statusCode === "number") return err.statusCode;
    if (typeof err.response?.statusCode === "number") return err.response.statusCode;
    return null;
}

export function getErrorBody(error: unknown): unknown {
    if (typeof error !== "object" || error === null) return undefined;
    const err = error as ApiExceptionLike;
    return err.body ?? err.response?.body;
}

/** Parse Volcano validatequeue webhook constraint messages into plain language. */
export function formatVolcanoQueueConstraint(message: string): string | null {
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

export function formatAdmissionWebhookMessage(message: string): string {
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
    const code = getErrorCode(error);
    if (code === null) {
        return error instanceof Error ? error.message : "An unexpected error occurred";
    }

    const status = parseK8sStatusBody(getErrorBody(error));
    const resourceName = status?.details?.name;
    const resourceKind = status?.details?.kind?.toLowerCase() ?? "resource";

    if (code === 409) {
        if (resourceName) {
            return `A ${resourceKind} named "${resourceName}" already exists. Choose a different name or delete the existing one.`;
        }
        return status?.message ?? "This resource already exists.";
    }

    if (code === 404) {
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

    if (code === 401) {
        return "Unauthorized: Authentication failed with the Kubernetes cluster.";
    }

    if (code === 403) {
        return "Forbidden: Insufficient permissions to perform this Kubernetes action.";
    }

    if (code === 500) {
        return "Kubernetes API server encountered an internal server error.";
    }

    if (code === 503) {
        return "Kubernetes API service is temporarily unavailable.";
    }

    if (error instanceof Error && error.name !== "ApiException" && !error.message.startsWith("HTTP-Code:")) {
        return error.message;
    }

    return `Kubernetes API request failed (HTTP ${code}).`;
}
