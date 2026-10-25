import yaml from "js-yaml";
import {
    isKnownAction,
    isKnownPlugin,
    PLUGIN_ENABLE_FLAG_KEYS,
    type PluginEnableFlagKey,
} from "../router/scheduler/metadata";
import {
    schedulerConfigSchema,
    type PluginOption,
    type SchedulerConfig,
} from "../router/scheduler/schema";

export type SchedulerConfigValidationResult = {
    valid: boolean;
    errors: string[];
    warnings: string[];
};

type RawSchedulerYaml = {
    actions?: string | string[];
    tiers?: Array<{ plugins?: Array<Record<string, unknown>> }>;
    configurations?: Array<{ name?: string; arguments?: Record<string, unknown> }>;
    metrics?: Record<string, string>;
};

function normalizeActions(actions: string | string[] | undefined): string[] {
    if (!actions) return [];
    if (Array.isArray(actions)) {
        return actions.map((a) => a.trim()).filter(Boolean);
    }
    return actions
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
}

function normalizeEnableFlags(plugin: Record<string, unknown>): Record<string, boolean> {
    const flags: Record<string, boolean> = {};
    for (const key of PLUGIN_ENABLE_FLAG_KEYS) {
        if (key in plugin && typeof plugin[key] === "boolean") {
            flags[key] = plugin[key] as boolean;
        }
    }
    return flags;
}

function normalizeArguments(
    args: Record<string, unknown> | undefined
): Record<string, string | number | boolean> | undefined {
    if (!args) return undefined;
    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(args)) {
        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            result[key] = value;
        } else if (value != null) {
            result[key] = String(value);
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

function normalizePlugin(plugin: Record<string, unknown>): PluginOption {
    const name = String(plugin.name ?? "");
    const normalized: Record<string, unknown> = { name };
    Object.assign(normalized, normalizeEnableFlags(plugin));
    const args = normalizeArguments(plugin.arguments as Record<string, unknown> | undefined);
    if (args) {
        normalized.arguments = args;
    }
    return normalized as PluginOption;
}

export function rawYamlToSchedulerConfig(raw: RawSchedulerYaml): SchedulerConfig {
    const actions = normalizeActions(raw.actions);
    const tiers = (raw.tiers ?? []).map((tier) => ({
        plugins: (tier.plugins ?? []).map((plugin) =>
            normalizePlugin(plugin as Record<string, unknown>)
        ),
    }));

    const config: SchedulerConfig = {
        actions,
        tiers,
    };

    if (raw.configurations?.length) {
        config.configurations = raw.configurations
            .filter((c) => c.name)
            .map((c) => ({
                name: String(c.name),
                arguments: normalizeArguments(c.arguments) ?? {},
            }));
    }

    if (raw.metrics && Object.keys(raw.metrics).length > 0) {
        config.metrics = raw.metrics;
    }

    return config;
}

export function parseSchedulerConfYaml(raw: string): SchedulerConfig {
    const loaded = yaml.load(raw) as RawSchedulerYaml | null;
    if (!loaded || typeof loaded !== "object") {
        throw new Error("Scheduler config must be a YAML object");
    }
    const config = rawYamlToSchedulerConfig(loaded);
    return schedulerConfigSchema.parse(config);
}

export function schedulerConfigToRawYaml(config: SchedulerConfig): RawSchedulerYaml {
    const raw: RawSchedulerYaml = {
        actions: config.actions.join(", "),
        tiers: config.tiers.map((tier) => ({
            plugins: tier.plugins.map((plugin) => {
                const entry: Record<string, unknown> = { name: plugin.name };
                for (const key of PLUGIN_ENABLE_FLAG_KEYS) {
                    const value = plugin[key as PluginEnableFlagKey];
                    if (typeof value === "boolean") {
                        entry[key] = value;
                    }
                }
                if (plugin.arguments && Object.keys(plugin.arguments).length > 0) {
                    entry.arguments = plugin.arguments;
                }
                return entry;
            }),
        })),
    };

    if (config.configurations?.length) {
        raw.configurations = config.configurations;
    }
    if (config.metrics && Object.keys(config.metrics).length > 0) {
        raw.metrics = config.metrics;
    }

    return raw;
}

export function serializeSchedulerConf(config: SchedulerConfig): string {
    const validated = schedulerConfigSchema.parse(config);
    const raw = schedulerConfigToRawYaml(validated);
    return yaml.dump(raw, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    });
}

export function validateSchedulerConfig(config: SchedulerConfig): SchedulerConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Stock Volcano refuses to reload configs with unknown action names, so
    // treat those as errors. Unknown plugins stay warnings (custom plugins OK).
    for (const action of config.actions) {
        if (!isKnownAction(action)) {
            errors.push(
                `Action "${action}" is not in the built-in registry; saving may break scheduler reload`
            );
        }
    }

    const seenPlugins = new Map<string, number>();
    for (let tierIndex = 0; tierIndex < config.tiers.length; tierIndex++) {
        const tier = config.tiers[tierIndex]!;
        if (tier.plugins.length === 0) {
            errors.push(`Tier ${tierIndex + 1} must have at least one plugin`);
        }
        for (const plugin of tier.plugins) {
            if (!plugin.name) {
                errors.push(`Tier ${tierIndex + 1} has a plugin without a name`);
                continue;
            }
            if (!isKnownPlugin(plugin.name)) {
                warnings.push(
                    `Plugin "${plugin.name}" is not in the built-in registry (custom plugin or different Volcano version?)`
                );
            }
            const firstTier = seenPlugins.get(plugin.name);
            if (firstTier !== undefined) {
                if (firstTier === tierIndex) {
                    errors.push(
                        `Plugin "${plugin.name}" is duplicated within tier ${tierIndex + 1}`
                    );
                } else {
                    warnings.push(
                        `Plugin "${plugin.name}" appears in multiple tiers (tier ${firstTier + 1} and tier ${tierIndex + 1})`
                    );
                }
            } else {
                seenPlugins.set(plugin.name, tierIndex);
            }
            for (const key of Object.keys(plugin.arguments ?? {})) {
                if (!key.trim()) {
                    errors.push(
                        `Plugin "${plugin.name}" has an argument with an empty key`
                    );
                }
            }
        }
    }

    for (const configuration of config.configurations ?? []) {
        for (const key of Object.keys(configuration.arguments)) {
            if (!key.trim()) {
                errors.push(
                    `Action configuration "${configuration.name}" has an argument with an empty key`
                );
            }
        }
    }

    if (!config.actions.includes("enqueue")) {
        warnings.push('Action "enqueue" is recommended for normal scheduling');
    }
    if (!config.actions.includes("allocate")) {
        warnings.push('Action "allocate" is recommended for normal scheduling');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * LCS-based line diff. A positional (line N vs line N) comparison would mark
 * every line after an insertion as changed; scheduler configs are small, so
 * the O(n*m) table is negligible.
 */
export function diffSchedulerYaml(before: string, after: string): string[] {
    const a = before.replace(/\r\n/g, "\n").split("\n");
    const b = after.replace(/\r\n/g, "\n").split("\n");
    const n = a.length;
    const m = b.length;

    // lcs[i][j] = length of the LCS of a[i:] and b[j:]
    const lcs: number[][] = Array.from({ length: n + 1 }, () =>
        new Array<number>(m + 1).fill(0)
    );
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lcs[i]![j] =
                a[i] === b[j]
                    ? lcs[i + 1]![j + 1]! + 1
                    : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
        }
    }

    const result: string[] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            result.push(`  ${a[i]}`);
            i++;
            j++;
        } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
            result.push(`- ${a[i]}`);
            i++;
        } else {
            result.push(`+ ${b[j]}`);
            j++;
        }
    }
    while (i < n) result.push(`- ${a[i++]}`);
    while (j < m) result.push(`+ ${b[j++]}`);

    return result;
}
