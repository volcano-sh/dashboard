import yaml from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import { SchedulerConfig, Tier, Plugin, PluginArg } from "./types";

export const parseConf = (yamlStr: string): SchedulerConfig => {
    try {
        const parsed = (yaml.load(yamlStr) || {}) as any;

        // Normalize actions
        let actions: string[] = [];
        if (typeof parsed.actions === "string") {
            actions = parsed.actions
                .split(",")
                .map((a: string) => a.trim())
                .filter(Boolean);
        } else if (Array.isArray(parsed.actions)) {
            actions = parsed.actions.map((a: any) => String(a).trim());
        }

        // Normalize tiers
        const rawTiers = Array.isArray(parsed.tiers) ? parsed.tiers : [];
        const tiers: Tier[] = rawTiers.map((rawTier: any) => {
            const rawPlugins = Array.isArray(rawTier.plugins)
                ? rawTier.plugins
                : [];
            const plugins: Plugin[] = rawPlugins.map((p: any) => {
                const name = p.name || "";
                const rawArgs = p.arguments || {};
                const argsList: PluginArg[] = Object.entries(rawArgs).map(
                    ([key, val]) => {
                        let typedVal: string | number | boolean = val;
                        if (val === "true") typedVal = true;
                        else if (val === "false") typedVal = false;
                        else if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) {
                            typedVal = Number(val);
                        }

                        return { key, value: typedVal };
                    },
                );

                return {
                    name,
                    enabled: true,
                    arguments: argsList,
                };
            });

            return {
                id: uuidv4(),
                plugins,
            };
        });

        // Ensure at least one tier exists if none are parsed
        if (tiers.length === 0) {
            tiers.push({ id: uuidv4(), plugins: [] });
        }

        return {
            actions,
            tiers,
        };
    } catch (err) {
        console.error("Failed to parse scheduler config yaml:", err);
        return {
            actions: ["enqueue", "allocate", "backfill"],
            tiers: [{ id: uuidv4(), plugins: [] }],
        };
    }
};

export const serialiseConf = (config: SchedulerConfig): string => {
    const output: any = {};

    // Actions join
    output.actions = config.actions.join(", ");

    // Serialize tiers
    output.tiers = config.tiers
        .map((tier) => {
            const activePlugins = tier.plugins
                .filter((p) => p.enabled)
                .map((p) => {
                    const pluginObj: any = { name: p.name };
                    if (p.arguments.length > 0) {
                        const argsObj: Record<string, any> = {};
                        p.arguments.forEach((arg) => {
                            if (arg.key.trim()) {
                                argsObj[arg.key.trim()] = arg.value;
                            }
                        });
                        if (Object.keys(argsObj).length > 0) {
                            pluginObj.arguments = argsObj;
                        }
                    }
                    return pluginObj;
                });

            return { plugins: activePlugins };
        })
        .filter((t) => t.plugins.length > 0);

    return yaml.dump(output, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    });
};
