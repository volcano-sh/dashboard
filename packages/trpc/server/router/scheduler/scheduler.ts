import { procedure, router } from "../../trpc";
import {
    getSchedulerConfigKey,
    getSchedulerConfigMapName,
    getSchedulerConfigMapNamespace,
    getSchedulerMetricsUrl,
} from "../../utils/scheduler-env";
import {
    parseSchedulerConfYaml,
    serializeSchedulerConf,
    validateSchedulerConfig,
} from "../../utils/scheduler-config";
import { parseSchedulerMetrics } from "../../utils/prometheus-parser";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sCoreApi } from "../../utils/k8s";
import {
    schedulerConfigSchema,
    updateSchedulerConfigInputSchema,
} from "./schema";

export const schedulerRouter = router({
    getSchedulerConfig: procedure.query(async () => {
        const namespace = getSchedulerConfigMapNamespace();
        const name = getSchedulerConfigMapName();
        const configKey = getSchedulerConfigKey();

        try {
            const configMap = await k8sCoreApi.readNamespacedConfigMap({
                name,
                namespace,
            });

            const rawYaml = configMap.data?.[configKey];
            if (!rawYaml) {
                throw new Error(
                    `ConfigMap ${namespace}/${name} is missing key "${configKey}"`
                );
            }

            const config = parseSchedulerConfYaml(rawYaml);
            const validation = validateSchedulerConfig(config);

            return {
                config,
                rawYaml,
                resourceVersion: configMap.metadata?.resourceVersion ?? undefined,
                namespace,
                name,
                configKey,
                validation,
            };
        } catch (error) {
            throw new Error(formatK8sApiError(error));
        }
    }),

    getMetrics: procedure.query(async () => {
        const metricsUrl = getSchedulerMetricsUrl();

        try {
            const response = await fetch(metricsUrl, {
                signal: AbortSignal.timeout(5000),
                headers: { Accept: "text/plain" },
            });

            if (!response.ok) {
                throw new Error(
                    `Scheduler metrics endpoint returned HTTP ${response.status}. ` +
                        "Confirm volcano-scheduler is running with --enable-metrics=true " +
                        `and reachable at ${metricsUrl}.`
                );
            }

            const text = await response.text();
            return parseSchedulerMetrics(text);
        } catch (error) {
            if (error instanceof Error && error.name === "TimeoutError") {
                throw new Error(
                    `Timed out fetching scheduler metrics from ${metricsUrl}. ` +
                        "Check that volcano-scheduler-service is up and metrics are enabled."
                );
            }
            if (error instanceof Error && error.message.startsWith("Scheduler metrics")) {
                throw error;
            }
            const detail = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Unable to reach scheduler metrics at ${metricsUrl}: ${detail}. ` +
                    "For local development, port-forward the service and set " +
                    "VOLCANO_SCHEDULER_METRICS_URL=http://localhost:18080/metrics."
            );
        }
    }),

    updateSchedulerConfig: procedure
        .input(updateSchedulerConfigInputSchema)
        .mutation(async ({ input }) => {
            const namespace = getSchedulerConfigMapNamespace();
            const name = getSchedulerConfigMapName();
            const configKey = getSchedulerConfigKey();
            const { config, resourceVersion } = input;

            const parsed = schedulerConfigSchema.parse(config);
            const validation = validateSchedulerConfig(parsed);
            if (!validation.valid) {
                throw new Error(validation.errors.join("; "));
            }

            const serialized = serializeSchedulerConf(parsed);

            try {
                const current = await k8sCoreApi.readNamespacedConfigMap({
                    name,
                    namespace,
                });

                if (
                    resourceVersion &&
                    current.metadata?.resourceVersion &&
                    current.metadata.resourceVersion !== resourceVersion
                ) {
                    throw new Error(
                        "ConfigMap was modified by another user. Refresh and try again."
                    );
                }

                // Replace (not patch) with the observed resourceVersion so the
                // API server rejects concurrent writes with a 409 atomically.
                current.data = {
                    ...current.data,
                    [configKey]: serialized,
                };

                const updated = await k8sCoreApi.replaceNamespacedConfigMap({
                    name,
                    namespace,
                    body: current,
                });

                const rawYaml = updated.data?.[configKey] ?? serialized;
                const updatedConfig = parseSchedulerConfYaml(rawYaml);

                return {
                    message: "Scheduler configuration updated successfully",
                    config: updatedConfig,
                    rawYaml,
                    resourceVersion: updated.metadata?.resourceVersion ?? undefined,
                    validation: validateSchedulerConfig(updatedConfig),
                    warnings: validation.warnings,
                };
            } catch (error) {
                if (error instanceof Error && error.message.includes("modified by another user")) {
                    throw error;
                }
                throw new Error(formatK8sApiError(error));
            }
        }),
});
