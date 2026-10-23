import { z } from "zod";
import { PLUGIN_ENABLE_FLAG_KEYS } from "./metadata";

const argumentValueSchema = z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
]);

const enableFlagShape = Object.fromEntries(
    PLUGIN_ENABLE_FLAG_KEYS.map((key) => [key, z.boolean().optional()])
) as Record<(typeof PLUGIN_ENABLE_FLAG_KEYS)[number], z.ZodOptional<z.ZodBoolean>>;

export const pluginOptionSchema = z.object({
    name: z.string().min(1),
    arguments: z.record(argumentValueSchema).optional(),
    ...enableFlagShape,
});

export const tierSchema = z.object({
    plugins: z.array(pluginOptionSchema).min(1),
});

export const actionConfigurationSchema = z.object({
    name: z.string().min(1),
    arguments: z.record(argumentValueSchema),
});

// Action names are not restricted in Zod: registries differ across Volcano
// versions. validateSchedulerConfig rejects unknown actions (stock Volcano
// hard-fails on reload) and warns on unknown plugins (custom plugins allowed).
export const schedulerConfigSchema = z.object({
    actions: z.array(z.string().min(1)).min(1),
    tiers: z.array(tierSchema).min(1),
    configurations: z.array(actionConfigurationSchema).optional(),
    metrics: z.record(z.string()).optional(),
});

export type SchedulerConfig = z.infer<typeof schedulerConfigSchema>;
export type PluginOption = z.infer<typeof pluginOptionSchema>;
export type Tier = z.infer<typeof tierSchema>;
export type ActionConfiguration = z.infer<typeof actionConfigurationSchema>;

export const updateSchedulerConfigInputSchema = z.object({
    config: schedulerConfigSchema,
    resourceVersion: z.string().optional(),
});

export type UpdateSchedulerConfigInput = z.infer<typeof updateSchedulerConfigInputSchema>;
