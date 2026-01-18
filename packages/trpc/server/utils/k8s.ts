import { CoreV1Api, CustomObjectsApi, KubeConfig } from "@kubernetes/client-node";
import https from 'https';

const kc = new KubeConfig();

try {
    kc.loadFromDefault();

    // Check if we should skip TLS verification based on environment variable
    const skipTLSVerify = process.env.K8S_SKIP_TLS_VERIFY === 'true';

    if (skipTLSVerify) {
        // Create HTTPS agent to skip TLS verification
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });

        // Set the agent on all clusters
        kc.getClusters().forEach(cluster => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (cluster as any).httpsAgent = httpsAgent;
        });
    }
} catch (error) {
    console.warn('Warning: Could not load Kubernetes config. Some features may not work:', error);
}

export const k8sApi = kc.makeApiClient(CustomObjectsApi);
export const k8sCoreApi = kc.makeApiClient(CoreV1Api);