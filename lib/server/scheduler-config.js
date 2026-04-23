import yaml from "js-yaml";
import { json, text, apiError } from "./api-utils";
import { yamlResponse } from "./kubernetes";

const defaultConfig = {
    namespace: "volcano-system",
    name: "volcano-scheduler-configmap",
    key: "",
};

const schedulerConfigTarget = () => ({
    namespace:
        process.env.SCHEDULER_CONFIG_NAMESPACE ||
        process.env.VOLCANO_SCHEDULER_CONFIG_NAMESPACE ||
        defaultConfig.namespace,
    name:
        process.env.SCHEDULER_CONFIG_NAME ||
        process.env.VOLCANO_SCHEDULER_CONFIG_NAME ||
        defaultConfig.name,
    key:
        process.env.SCHEDULER_CONFIG_KEY ||
        process.env.VOLCANO_SCHEDULER_CONFIG_KEY ||
        defaultConfig.key,
});

export async function getSchedulerConfig(k8sCoreApi) {
    const target = schedulerConfigTarget();
    const configMap = await k8sCoreApi.readNamespacedConfigMap({
        namespace: target.namespace,
        name: target.name,
    });
    const data = configMap?.data || {};
    const key =
        target.key ||
        [
            "volcano-scheduler.conf",
            "scheduler.conf",
            "config.yaml",
            "config.yml",
        ].find((candidate) => data[candidate]) ||
        Object.keys(data)[0];

    const rawYaml = key ? data[key] || "" : "";
    const parsed = rawYaml ? yaml.load(rawYaml) || {} : {};

    return {
        target: { ...target, key },
        configMap,
        rawYaml,
        parsed,
        scheduler: {
            name: parsed.schedulerName || parsed.scheduler?.name || "volcano",
            actions: extractActions(parsed),
            tiers: parsed.tiers || [],
            configurations: parsed.configurations || [],
        },
        policies: extractPolicies(parsed),
        plugins: extractPlugins(parsed),
        preemption: extractPreemption(parsed),
    };
}

export async function schedulerConfigJson(k8sCoreApi) {
    try {
        return json(await getSchedulerConfig(k8sCoreApi));
    } catch (error) {
        return apiError(error, "Failed to fetch scheduler config");
    }
}

export async function schedulerConfigYaml(k8sCoreApi) {
    try {
        const config = await getSchedulerConfig(k8sCoreApi);
        return text(config.rawYaml || yamlResponse(config.configMap));
    } catch (error) {
        return apiError(error, "Failed to fetch scheduler config YAML");
    }
}

function extractActions(config) {
    if (Array.isArray(config.actions)) return config.actions;
    if (typeof config.actions === "string") {
        return config.actions
            .split(",")
            .map((action) => action.trim())
            .filter(Boolean);
    }
    return [];
}

function extractPlugins(config) {
    const tiers = Array.isArray(config.tiers) ? config.tiers : [];
    return tiers.flatMap((tier) =>
        (tier.plugins || []).map((plugin) => ({
            tier: tier.name || "",
            name: plugin.name || plugin,
            enabled: plugin.enabled !== false,
            arguments: plugin.arguments || {},
        })),
    );
}

function extractPolicies(config) {
    return {
        queueOrder: config.queueOrder || config.queueOrdering || "",
        jobOrder: config.jobOrder || "",
        resourceOrder: config.resourceOrder || "",
        nodeOrder: config.nodeOrder || "",
        reclaim: config.reclaim || config.reclaimable,
        backfill: config.backfill,
    };
}

function extractPreemption(config) {
    return {
        enabled:
            config.preemption?.enabled ??
            config.preemptable ??
            config.reclaimable ??
            false,
        victimSelection:
            config.preemption?.victimSelection ||
            config.victimSelection ||
            config.victimSelectionPolicy ||
            "",
        raw: config.preemption || {},
    };
}
