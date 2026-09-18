import { CoreV1Api, CustomObjectsApi, KubeConfig } from "@kubernetes/client-node";

const kc = new KubeConfig();

try {
    kc.loadFromDefault();

    const skipTLSVerify = process.env.K8S_SKIP_TLS_VERIFY === "true";
    const serverOverride = process.env.K8S_SERVER?.trim();

    if (skipTLSVerify || serverOverride) {
        const clusters = kc.getClusters().map((cluster) => ({
            ...cluster,
            ...(serverOverride && { server: serverOverride }),
            ...(skipTLSVerify && { skipTLSVerify: true }),
        }));

        kc.loadFromOptions({
            clusters,
            users: kc.getUsers(),
            contexts: kc.getContexts(),
            currentContext: kc.getCurrentContext(),
        });
    }
} catch (error) {
    console.warn("Warning: Could not load Kubernetes config:", error);
}

/**
 * Build-time / no-cluster fallback. Next.js evaluates /api/trpc during
 * `next build`, so makeApiClient must not throw at module import when there
 * is no kubeconfig current-context.
 */
function createUnavailableClientProxy<T extends object>(name: string): T {
    return new Proxy({} as T, {
        get(_target, prop) {
            if (prop === "then") {
                return undefined;
            }
            return () => {
                throw new Error(
                    `No active Kubernetes cluster configured (${name}). Set a current context with \`kubectl config use-context <name>\` or provide an in-cluster config.`
                );
            };
        },
    });
}

function createCoreApi(): CoreV1Api {
    try {
        if (kc.getCurrentCluster()) {
            return kc.makeApiClient(CoreV1Api);
        }
    } catch (error) {
        console.warn("Warning: Could not create CoreV1Api client:", error);
    }
    return createUnavailableClientProxy<CoreV1Api>("CoreV1Api");
}

function createCustomObjectsApi(): CustomObjectsApi {
    try {
        if (kc.getCurrentCluster()) {
            return kc.makeApiClient(CustomObjectsApi);
        }
    } catch (error) {
        console.warn("Warning: Could not create CustomObjectsApi client:", error);
    }
    return createUnavailableClientProxy<CustomObjectsApi>("CustomObjectsApi");
}

export const k8sApi = createCustomObjectsApi();
export const k8sCoreApi = createCoreApi();
