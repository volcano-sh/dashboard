export function getSchedulerConfigMapNamespace(): string {
    return process.env.VOLCANO_SCHEDULER_CONFIGMAP_NAMESPACE?.trim() || "volcano-system";
}

export function getSchedulerConfigMapName(): string {
    return process.env.VOLCANO_SCHEDULER_CONFIGMAP_NAME?.trim() || "volcano-scheduler-configmap";
}

export function getSchedulerConfigKey(): string {
    return process.env.VOLCANO_SCHEDULER_CONFIG_KEY?.trim() || "volcano-scheduler.conf";
}

export function getSchedulerMetricsUrl(): string {
    return (
        process.env.VOLCANO_SCHEDULER_METRICS_URL?.trim() ||
        "http://volcano-scheduler-service.volcano-system.svc:8080/metrics"
    );
}
