import { json, apiError } from "./api-utils";

const defaultSchedulerConfig = {
    namespace: "volcano-system",
    name: "volcano-scheduler-configmap",
    key: "",
};

const schedulerConfigTarget = () => ({
    namespace:
        process.env.SCHEDULER_CONFIG_NAMESPACE ||
        process.env.VOLCANO_SCHEDULER_CONFIG_NAMESPACE ||
        defaultSchedulerConfig.namespace,
    name:
        process.env.SCHEDULER_CONFIG_NAME ||
        process.env.VOLCANO_SCHEDULER_CONFIG_NAME ||
        defaultSchedulerConfig.name,
    key:
        process.env.SCHEDULER_CONFIG_KEY ||
        process.env.VOLCANO_SCHEDULER_CONFIG_KEY ||
        defaultSchedulerConfig.key,
});

export function getClusterInfo(kc) {
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
    const schedulerTarget = schedulerConfigTarget();

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

export function clusterInfoJson(kc) {
    try {
        return json(getClusterInfo(kc));
    } catch (error) {
        return apiError(error, "Failed to fetch cluster info");
    }
}
