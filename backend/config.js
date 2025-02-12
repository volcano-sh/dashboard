import { KubeConfig, CustomObjectsApi, CoreV1Api } from "@kubernetes/client-node";

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CustomObjectsApi);
const k8sCoreApi = kc.makeApiClient(CoreV1Api);

export { k8sApi, k8sCoreApi };
