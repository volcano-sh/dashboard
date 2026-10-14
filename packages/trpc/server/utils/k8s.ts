import { CoreV1Api, CustomObjectsApi, KubeConfig } from "@kubernetes/client-node";

function createKubeConfig(): KubeConfig {
    const kc = new KubeConfig();

    try {
        kc.loadFromDefault();

        const skipTLSVerify = process.env.K8S_SKIP_TLS_VERIFY === "true";
        const serverOverride = process.env.K8S_SERVER?.trim();

        if (skipTLSVerify || serverOverride) {
            const clusters = kc.getClusters().map(((cluster)) => ({
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

    return kc;
}

let k8sApiClient: CustomObjectsApi | undefined;
let k8sCoreApiClient: CoreV1Api | undefined;

function ensureClients(): void {
    if (k8sApiClient && k8sCoreApiClient) {
        return;
    }

    const kc = createKubeConfig();
    // makeApiClient throws "No active cluster!" when kubeconfig is missing
    // (e.g. during `next build` page-data collection). Defer until first use.
    k8sApiClient = kc.makeApiClient(CustomObjectsApi);
    k8sCoreApiClient = kc.makeApiClient(CoreV1Api);
}

function lazyClient<T extends object>(getClient: () => T): T {
    return new Proxy({} as T, {
        get(_target, prop, receiver) {
            const client = getClient();
            const value = Reflect.get(client as object, prop, receiver);
            return typeof value === "function" ? value.bind(client) : value;
        },
    });
}

/** Lazily initialized so importing the tRPC router does not require a kubeconfig. */
export const k8sApi = lazyClient(() => {
    ensureClients();
    return k8sApiClient!;
});

/** Lazily initialized so importing the tRPC router does not require a kubeconfig. */
export const k8sCoreApi = lazyClient(() => {
    ensureClients();
    return k8sCoreApiClient!;
});
