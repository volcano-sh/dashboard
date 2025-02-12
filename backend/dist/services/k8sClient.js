import { CoreV1Api, CustomObjectsApi, KubeConfig } from "@kubernetes/client-node";

// Initialize Kubernetes client
const kc = new KubeConfig();
kc.loadFromDefault();

// Create Kubernetes API clients
const k8sCoreApi = kc.makeApiClient(CoreV1Api);
const k8sApi = kc.makeApiClient(CustomObjectsApi);

// Export the clients for use in other files
export { k8sCoreApi, k8sApi };
