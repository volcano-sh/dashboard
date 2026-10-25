import { procedure, router } from "../../trpc";
import {
    getSchedulerConfigKey,
    getSchedulerConfigMapName,
    getSchedulerConfigMapNamespace,
} from "../../utils/scheduler-env";
import {
    parseSchedulerConfYaml,
    serializeSchedulerConf,
    validateSchedulerConfig,
} from "../../utils/scheduler-config";
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
