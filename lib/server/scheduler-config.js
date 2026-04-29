import yaml from "js-yaml";
import { json, text, apiError } from "./api-utils";
import { getDashboardConfig } from "./config";
import { yamlResponse } from "./kubernetes";

const defaultConfig = {
    namespace: "volcano-system",
    name: "volcano-scheduler-configmap",
    key: "",
};

const actionDescriptions = {
    enqueue: {
        subtitle: "Admit into Queue",
        goal: "Decide whether the job can enter the scheduling queue.",
        resultSuccess: "Admitted to queue",
        resultFailure: "Rejected",
    },
    allocate: {
        subtitle: "Allocate Resources",
        goal: "Find and reserve the best node(s) for the job.",
        resultSuccess: "Bind to node(s)",
        resultFailure: "Keep waiting",
    },
    preempt: {
        subtitle: "Preempt Lower Priority Workloads",
        goal: "Free resources by preempting lower-priority workloads.",
        resultSuccess: "Resources reclaimed",
        resultFailure: "No safe victim",
    },
    reclaim: {
        subtitle: "Reclaim Shared Capacity",
        goal: "Reclaim resources from reclaimable queues when needed.",
        resultSuccess: "Capacity reclaimed",
        resultFailure: "No reclaimable quota",
    },
    backfill: {
        subtitle: "Utilize Idle Resources",
        goal: "Schedule lower-priority or BestEffort jobs using idle resources.",
        resultSuccess: "Utilize idle resources",
        resultFailure: "No resources",
    },
};

const actionHooks = {
    enqueue: ["JobEnqueueable", "JobEnqueued"],
    allocate: ["Allocatable", "PredicateFn", "NodeOrderFn", "JobReady"],
    preempt: ["Preemptable", "JobStarving", "JobPipelined"],
    reclaim: ["Reclaimable", "Preemptive", "Overused"],
    backfill: ["PredicateFn", "NodeOrderFn"],
};

const pluginCapabilities = {
    gang: ["JobEnqueueable", "JobEnqueued", "JobReady", "JobPipelined"],
    priority: ["JobOrderFn", "TaskOrderFn", "Preemptable"],
    drf: ["JobOrderFn", "Preemptable"],
    predicates: ["PredicateFn"],
    nodeorder: ["NodeOrderFn"],
    binpack: ["NodeOrderFn"],
    proportion: ["Allocatable", "Reclaimable", "Overused"],
    conformance: ["JobEnqueueable"],
    overcommit: ["JobEnqueueable"],
    sla: ["JobStarving", "JobOrderFn"],
    tdm: ["Preemptable", "NodeOrderFn"],
    capacity: ["Allocatable", "Reclaimable", "Overused"],
    numaaware: ["PredicateFn", "NodeOrderFn"],
    "task-topology": ["NodeOrderFn"],
    tasktopology: ["NodeOrderFn"],
};

const pluginDescriptions = {
    gang: "Ensure gang scheduling constraints.",
    priority: "Order jobs and tasks by priority.",
    drf: "Fair sharing based on dominant resource fairness.",
    predicates: "Filter out nodes that do not meet requirements.",
    nodeorder: "Score and rank nodes.",
    binpack: "Pack tasks to improve resource utilization.",
    proportion: "Check whether the queue has enough allocatable quota.",
    conformance: "Check whether the job meets queue and user policies.",
    overcommit: "Allow scheduling beyond committed resources.",
    sla: "Protect starving workloads with SLA-aware ordering.",
    tdm: "Balance preemption and placement with TDM policies.",
    capacity: "Enforce queue capacity boundaries during scheduling.",
    numaaware: "Prefer NUMA-aware placement and scoring.",
    "task-topology": "Score nodes based on task topology locality.",
    tasktopology: "Score nodes based on task topology locality.",
};

const schedulerConfigTarget = async () =>
    (await getDashboardConfig()).schedulerConfig || defaultConfig;

export async function getSchedulerConfig(k8sCoreApi) {
    const target = await schedulerConfigTarget();
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
        flow: extractFlow(parsed),
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

function extractFlow(config) {
    const actions = extractActions(config).map((name, index) => ({
        name,
        order: index + 1,
        title: String(name || "").toUpperCase(),
        subtitle:
            actionDescriptions[name]?.subtitle || "Configured action stage",
        goal:
            actionDescriptions[name]?.goal ||
            "Configured Volcano scheduling action.",
        resultSuccess: actionDescriptions[name]?.resultSuccess || "Completed",
        resultFailure: actionDescriptions[name]?.resultFailure || "Deferred",
    }));

    const hooksByAction = Object.fromEntries(
        actions.map((action) => [action.name, actionHooks[action.name] || []]),
    );

    const plugins = extractPlugins(config).map((plugin) => {
        const hooks =
            pluginCapabilities[normalizePluginName(plugin.name)] || [];
        const actionsForPlugin = actions
            .filter((action) =>
                (hooksByAction[action.name] || []).some((hook) =>
                    hooks.includes(hook),
                ),
            )
            .map((action) => action.name);

        return {
            ...plugin,
            description:
                pluginDescriptions[normalizePluginName(plugin.name)] ||
                "Participates in the scheduling decision.",
            hooks,
            actions: actionsForPlugin,
            hookMappingAvailable: hooks.length > 0,
        };
    });

    const stepsByAction = Object.fromEntries(
        actions.map((action) => {
            const steps = (hooksByAction[action.name] || []).map(
                (hook, index) => ({
                    order: index + 1,
                    hook,
                    label: `Step ${index + 1}`,
                    plugins: plugins.filter(
                        (plugin) =>
                            plugin.actions.includes(action.name) &&
                            plugin.hooks.includes(hook),
                    ),
                }),
            );

            return [action.name, steps];
        }),
    );

    const edges = [
        ...actions.flatMap((action) =>
            (hooksByAction[action.name] || []).map((hook) => ({
                fromType: "action",
                from: action.name,
                toType: "hook",
                to: hook,
            })),
        ),
        ...plugins.flatMap((plugin) =>
            plugin.hooks.map((hook) => ({
                fromType: "hook",
                from: hook,
                toType: "plugin",
                to: plugin.name,
            })),
        ),
    ];

    return {
        actions,
        hooksByAction,
        stepsByAction,
        plugins,
        edges,
        legend: {
            configured:
                "Actions, tiers, and plugins come directly from the active scheduler ConfigMap.",
            derived:
                "Hooks and action-to-plugin relationships are derived from Volcano scheduling semantics.",
        },
    };
}

function normalizePluginName(name) {
    return String(name || "")
        .trim()
        .toLowerCase();
}
