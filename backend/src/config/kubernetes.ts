import {
    CoreV1Api,
    CustomObjectsApi,
    KubeConfig
} from "@kubernetes/client-node";

const kc = new KubeConfig();
kc.loadFromDefault();

export const k8sApi = kc.makeApiClient(CustomObjectsApi);
export const k8sCoreApi = kc.makeApiClient(CoreV1Api);
