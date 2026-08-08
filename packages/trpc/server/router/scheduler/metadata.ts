export const ACTION_NAMES = [
    "enqueue",
    "allocate",
    "backfill",
    "preempt",
    "reclaim",
    "shuffle",
    "gangpreempt",
    "gangreclaim",
] as const;

export type ActionName = (typeof ACTION_NAMES)[number];

export const PLUGIN_NAMES = [
    "priority",
    "gang",
    "conformance",
    "overcommit",
    "drf",
    "predicates",
    "proportion",
    "nodeorder",
    "binpack",
    "deviceshare",
    "numa-aware",
    "sla",
    "task-topology",
    "tdm",
    "extender",
    "resource-strategy-fit",
    "cdp",
    "rescheduling",
    "usage",
    "pdb",
    "nodegroup",
    "network-topology-aware",
    "capacity",
    "resourcequota",
] as const;

export type PluginName = (typeof PLUGIN_NAMES)[number];

export const PLUGIN_ENABLE_FLAG_KEYS = [
    "enableJobOrder",
    "enableHierarchy",
    "enableJobReady",
    "enableJobPipelined",
    "enableTaskOrder",
    "enablePreemptable",
    "enableReclaimable",
    "enablePreemptive",
    "enableQueueOrder",
    "EnabledClusterOrder",
    "enablePredicate",
    "enableBestNode",
    "enableNodeOrder",
    "enableTargetJob",
    "enableReservedNodes",
    "enableJobEnqueued",
    "enabledVictim",
    "enableJobStarving",
    "enabledOverused",
    "enabledAllocatable",
    "enabledHyperNodeOrder",
    "enabledSubJobReady",
    "enabledSubJobPipelined",
    "enabledSubJobOrder",
    "enabledHyperNodeGradient",
] as const;

export type PluginEnableFlagKey = (typeof PLUGIN_ENABLE_FLAG_KEYS)[number];

export const PLUGIN_ENABLE_FLAG_LABELS: Record<PluginEnableFlagKey, string> = {
    enableJobOrder: "Job order",
    enableHierarchy: "Hierarchy",
    enableJobReady: "Job ready",
    enableJobPipelined: "Job pipelined",
    enableTaskOrder: "Task order",
    enablePreemptable: "Preemptable",
    enableReclaimable: "Reclaimable",
    enablePreemptive: "Preemptive",
    enableQueueOrder: "Queue order",
    EnabledClusterOrder: "Cluster order",
    enablePredicate: "Predicate",
    enableBestNode: "Best node",
    enableNodeOrder: "Node order",
    enableTargetJob: "Target job",
    enableReservedNodes: "Reserved nodes",
    enableJobEnqueued: "Job enqueued",
    enabledVictim: "Victim",
    enableJobStarving: "Job starving",
    enabledOverused: "Overused",
    enabledAllocatable: "Allocatable",
    enabledHyperNodeOrder: "Hyper node order",
    enabledSubJobReady: "Sub-job ready",
    enabledSubJobPipelined: "Sub-job pipelined",
    enabledSubJobOrder: "Sub-job order",
    enabledHyperNodeGradient: "Hyper node gradient",
};

export type ArgumentFieldType = "string" | "number" | "boolean";

export type PluginArgumentField = {
    key: string;
    label: string;
    type: ArgumentFieldType;
    description?: string;
};

/** Known argument schemas for common plugins. Unknown keys remain editable as strings. */
export const PLUGIN_ARGUMENT_SCHEMAS: Partial<Record<PluginName, PluginArgumentField[]>> = {
    binpack: [
        { key: "binpack.weight", label: "Weight", type: "number" },
        { key: "binpack.cpu", label: "CPU weight", type: "number" },
        { key: "binpack.memory", label: "Memory weight", type: "number" },
    ],
    predicates: [
        { key: "predicate.NodeAffinityEnable", label: "Node affinity", type: "boolean" },
        { key: "predicate.GPUSharingEnable", label: "GPU sharing", type: "boolean" },
        { key: "predicate.CacheEnable", label: "Cache", type: "boolean" },
    ],
    overcommit: [
        { key: "overcommit-factor", label: "Overcommit factor", type: "number" },
    ],
    gang: [
        { key: "gang.podsfactor", label: "Pods factor", type: "number" },
    ],
    drf: [
        { key: "drf.hierarchyEnabled", label: "Hierarchy enabled", type: "boolean" },
    ],
    nodeorder: [
        { key: "nodeaffinity.weight", label: "Node affinity weight", type: "number" },
        { key: "podaffinity.weight", label: "Pod affinity weight", type: "number" },
        { key: "leastrequested.weight", label: "Least requested weight", type: "number" },
    ],
    "numa-aware": [
        { key: "weight", label: "Weight", type: "number" },
    ],
    sla: [
        { key: "sla-waiting-time", label: "SLA waiting time", type: "string" },
    ],
    usage: [
        { key: "usage.weight", label: "Weight", type: "number" },
    ],
    extender: [
        { key: "extender.urlPrefix", label: "URL prefix", type: "string" },
        { key: "extender.httpTimeout", label: "HTTP timeout", type: "string" },
        { key: "extender.ignorable", label: "Ignorable", type: "boolean" },
    ],
};

/** Applicable enable flags per plugin (subset of PluginOption fields). */
export const PLUGIN_ENABLE_FLAGS: Partial<Record<PluginName, PluginEnableFlagKey[]>> = {
    priority: ["enableJobOrder", "enableTaskOrder", "enablePreemptable", "enableJobStarving"],
    gang: ["enableJobReady", "enableJobPipelined", "enablePreemptable", "enableReclaimable", "enableJobOrder", "enableJobStarving"],
    conformance: ["enablePreemptable", "enableReclaimable"],
    overcommit: ["enableJobEnqueued"],
    drf: ["enableJobOrder", "enableQueueOrder", "enablePreemptable", "enableReclaimable", "enableTaskOrder"],
    predicates: ["enablePredicate"],
    proportion: ["enableQueueOrder", "enableReclaimable", "enabledOverused", "enabledAllocatable"],
    nodeorder: ["enableNodeOrder"],
    binpack: ["enableNodeOrder"],
    capacity: ["enableQueueOrder", "enableReclaimable", "enabledOverused", "enabledAllocatable"],
    nodegroup: ["enableHierarchy", "enableQueueOrder"],
    tdm: ["enablePredicate", "enableNodeOrder", "enablePreemptable", "enabledVictim", "enableJobOrder", "enableJobPipelined", "enableJobStarving"],
    sla: ["enableJobOrder", "enableJobPipelined"],
    "task-topology": ["enableTaskOrder", "enableNodeOrder"],
    "numa-aware": ["enablePredicate", "enableNodeOrder"],
    deviceshare: ["enablePredicate"],
    rescheduling: ["enableJobOrder"],
    usage: ["enableNodeOrder"],
    pdb: ["enablePreemptable"],
    extender: ["enablePredicate", "enablePreemptable", "enableReclaimable"],
    "resource-strategy-fit": ["enablePredicate", "enableNodeOrder"],
    "network-topology-aware": ["enablePredicate", "enableNodeOrder"],
    cdp: ["enablePredicate"],
    resourcequota: ["enablePredicate"],
};

export const ACTION_DESCRIPTIONS: Record<ActionName, string> = {
    enqueue: "Admit PodGroups to inqueue if cluster can satisfy min resources",
    allocate: "Bind resources to in-queue workloads",
    backfill: "Schedule BestEffort / leftover pods",
    preempt: "Evict lower-priority tasks for higher-priority ones",
    reclaim: "Reclaim borrowed queue resources",
    shuffle: "Reschedule / shuffle workloads",
    gangpreempt: "Gang-aware preemption",
    gangreclaim: "Gang-aware reclaim",
};

export function isKnownAction(name: string): name is ActionName {
    return (ACTION_NAMES as readonly string[]).includes(name);
}

export function isKnownPlugin(name: string): name is PluginName {
    return (PLUGIN_NAMES as readonly string[]).includes(name);
}

export function getPluginEnableFlags(pluginName: string): PluginEnableFlagKey[] {
    if (isKnownPlugin(pluginName)) {
        return PLUGIN_ENABLE_FLAGS[pluginName] ?? [];
    }
    return [];
}

export function getPluginArgumentSchema(pluginName: string): PluginArgumentField[] {
    if (isKnownPlugin(pluginName)) {
        return PLUGIN_ARGUMENT_SCHEMAS[pluginName] ?? [];
    }
    return [];
}
