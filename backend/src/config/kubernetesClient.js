import { KubeConfig, CoreV1Api, CustomObjectsApi } from "@kubernetes/client-node";

// Initialize Kubernetes configuration
const kc = new KubeConfig();
kc.loadFromDefault();

// Create API clients
export const k8sApi = kc.makeApiClient(CustomObjectsApi);
export const k8sCoreApi = kc.makeApiClient(CoreV1Api);