import { json, apiError } from "./api-utils";
import { getDashboardConfig } from "./config";

const defaultSchedulerConfig = {
    namespace: "volcano-system",
    name: "volcano-scheduler-configmap",
    key: "",
};

const schedulerConfigTarget = async () =>
    (await getDashboardConfig()).schedulerConfig || defaultSchedulerConfig;

export async function getClusterInfo(kc) {
    const currentContextName = kc.getCurrentContext();
    const currentContext =
        kc.contexts?.find((context) => context.name === currentContextName) ||
        null;
    const currentCluster =
        kc.clusters?.find(
            (cluster) => cluster.name === currentContext?.cluster,
        ) ||
        kc.getCurrentCluster?.() ||
        null;
    const currentUser =
        kc.users?.find((user) => user.name === currentContext?.user) || null;
    const schedulerTarget = await schedulerConfigTarget();

    return {
        connection: {
            mode: process.env.KUBERNETES_SERVICE_HOST
                ? "In-cluster"
                : "Kubeconfig",
            currentContext: currentContext?.name || "",
            namespace: currentContext?.namespace || "default",
            cluster: currentCluster?.name || "",
            user: currentUser?.name || "",
            server: currentCluster?.server || "",
        },
        security: {
            insecureSkipTlsVerify:
                currentCluster?.skipTLSVerify ||
                currentCluster?.insecureSkipTlsVerify ||
                false,
            certificateAuthority:
                currentCluster?.caFile || currentCluster?.caData || "",
            authProvider:
                currentUser?.authProvider?.name ||
                (currentUser?.token ? "token" : "") ||
                (currentUser?.certFile ? "client-cert" : "") ||
                "",
        },
        schedulerConfig: {
            namespace: schedulerTarget.namespace,
            name: schedulerTarget.name,
            key: schedulerTarget.key || "auto-detect",
        },
    };
}

export async function clusterInfoJson(kc) {
    try {
        return json(await getClusterInfo(kc));
    } catch (error) {
        return apiError(error, "Failed to fetch cluster info");
    }
}
