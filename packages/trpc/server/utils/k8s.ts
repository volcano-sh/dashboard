import { CoreV1Api, CustomObjectsApi, KubeConfig } from "@kubernetes/client-node";

const kc = new KubeConfig();

try {
    kc.loadFromDefault();

    const skipTLSVerify = process.env.K8S_SKIP_TLS_VERIFY === 'true';
    const serverOverride = process.env.K8S_SERVER?.trim();

    if (skipTLSVerify || serverOverride) {
        const clusters = kc.getClusters().map(cluster => ({
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
    console.warn('Warning: Could not load Kubernetes config:', error);
}

export const k8sApi = kc.makeApiClient(CustomObjectsApi);
export const k8sCoreApi = kc.makeApiClient(CoreV1Api);
