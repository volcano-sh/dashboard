import { CoreV1Api, CustomObjectsApi, KubeConfig } from "@kubernetes/client-node";
import { isDemoMode } from "./demo";

let k8sApiInstance: CustomObjectsApi | null = null;
let k8sCoreApiInstance: CoreV1Api | null = null;

function getClients() {
    if (k8sApiInstance && k8sCoreApiInstance) {
        return { k8sApi: k8sApiInstance, k8sCoreApi: k8sCoreApiInstance };
    }

    if (isDemoMode()) {
        throw new Error("Kubernetes clients are unavailable in demo mode.");
    }

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

    k8sApiInstance = kc.makeApiClient(CustomObjectsApi);
    k8sCoreApiInstance = kc.makeApiClient(CoreV1Api);

    return { k8sApi: k8sApiInstance, k8sCoreApi: k8sCoreApiInstance };
}

export const k8sApi = new Proxy({} as CustomObjectsApi, {
    get(_target, prop) {
        const client = getClients().k8sApi;
        const value = Reflect.get(client, prop);
        return typeof value === "function" ? value.bind(client) : value;
    },
});

export const k8sCoreApi = new Proxy({} as CoreV1Api, {
    get(_target, prop) {
        const client = getClients().k8sCoreApi;
        const value = Reflect.get(client, prop);
        return typeof value === "function" ? value.bind(client) : value;
    },
});
