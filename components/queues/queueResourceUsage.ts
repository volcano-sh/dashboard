const formatResource = (value, fallback = "0") => {
    if (value === undefined || value === null || value === "") return fallback;
    return String(value);
};

const MEMORY_UNITS_TO_GI = {
    Ki: 1 / 1024 / 1024,
    Mi: 1 / 1024,
    Gi: 1,
    Ti: 1024,
};

export const QUEUE_RESOURCE_COLUMNS = [
    {
        key: "cpu",
        label: "CPU",
        resourceKey: "cpu",
        unit: "cores",
    },
    {
        key: "memory",
        label: "Memory",
        resourceKey: "memory",
        unit: "Gi",
    },
    {
        key: "gpu",
        label: "GPU",
        resourceKey: "nvidia.com/gpu",
        fallbackKeys: ["gpu"],
        unit: "GPUs",
    },
];

export const hasUnit = (value) => /[a-zA-Z]/.test(String(value || ""));

export const formatResourceMetric = (value, resource, includeUnit = true) => {
    if (!includeUnit || hasUnit(value)) return value;
    return `${value} ${resource.unit}`;
};

export const parseResourceQuantity = (value, resource) => {
    const text = String(value || "0").trim();
    if (!text) return 0;

    if (resource.key === "memory") {
        const match = text.match(/^([0-9.]+)\s*([KMGTP]i)?$/);
        if (match) {
            const amount = Number.parseFloat(match[1]);
            const unit = match[2] || "Gi";
            const multiplier = MEMORY_UNITS_TO_GI[unit] ?? 1;
            return Number.isFinite(amount) ? amount * multiplier : 0;
        }
    }

    if (resource.key === "cpu" && text.endsWith("m")) {
        const amount = Number.parseFloat(text.slice(0, -1));
        return Number.isFinite(amount) ? amount / 1000 : 0;
    }

    const parsed = Number.parseFloat(text.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
};

const getSpecResource = (queue, key, resourceKey) => {
    const section = queue?.spec?.[key];
    if (!section) return undefined;
    return section?.resource?.[resourceKey] || section?.[resourceKey];
};

const getStatusResource = (queue, key, resourceKey) => {
    return queue?.status?.[key]?.[resourceKey];
};

const getResourceFromSection = (queue, section, resource) => {
    const keys = [resource.resourceKey, ...(resource.fallbackKeys || [])];
    for (const key of keys) {
        const value =
            section === "status"
                ? getStatusResource(queue, "allocated", key)
                : getSpecResource(queue, section, key);
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return undefined;
};

const getPendingResource = (queue, resource) => {
    const keys = [resource.resourceKey, ...(resource.fallbackKeys || [])];
    for (const key of keys) {
        const value =
            getStatusResource(queue, "pending", key) ||
            getStatusResource(queue, "inqueue", key);
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return undefined;
};

export const getQueueResourceStats = (queue, resource) => {
    const guaranteeRaw = getResourceFromSection(queue, "guarantee", resource);
    const usedRaw = getResourceFromSection(queue, "status", resource);
    const deservedRaw = getResourceFromSection(queue, "deserved", resource);
    const capabilityRaw = getResourceFromSection(queue, "capability", resource);
    const guarantee = parseResourceQuantity(guaranteeRaw, resource);
    const used = parseResourceQuantity(usedRaw, resource);
    const deserved = parseResourceQuantity(deservedRaw, resource);
    const capability = parseResourceQuantity(capabilityRaw, resource);
    const scale = Math.max(capability, deserved, guarantee, used, 1);
    const usagePercent = deserved ? (used / deserved) * 100 : 0;
    const guaranteePercent = Math.min((guarantee / scale) * 100, 100);
    const deservedPercent = Math.min((deserved / scale) * 100, 100);
    const usedPercent = Math.min((used / scale) * 100, 100);
    const overCapability = Boolean(capability && used > capability);
    const usageTone = overCapability
        ? "hot"
        : !used
          ? "idle"
          : usagePercent > 110
            ? "hot"
            : usagePercent < 50
              ? "starving"
              : usagePercent < 70
                ? "underused"
                : "healthy";

    return {
        capability,
        capabilityLabel: formatResource(capabilityRaw, "0"),
        deserved,
        deservedLabel: formatResource(deservedRaw, "0"),
        deservedPercent,
        guarantee,
        guaranteeLabel: formatResource(guaranteeRaw, "0"),
        guaranteePercent,
        overCapability,
        pendingLabel: formatResource(getPendingResource(queue, resource)),
        scale,
        usageLabel: deserved ? `${Math.round(usagePercent)}%` : "0%",
        usagePercent,
        usageTone,
        used,
        usedLabel: formatResource(usedRaw, "0"),
        usedPercent,
    };
};

export const formatResourceValueText = (stats, resource) => {
    const values = [
        stats.usedLabel,
        stats.deservedLabel,
        stats.capabilityLabel,
    ];
    const suffix = values.some(hasUnit) ? "" : ` ${resource.unit}`;
    return `${values.join(" / ")}${suffix} (${stats.usageLabel})`;
};

export const getQueueResourceStatusItems = (queue) =>
    QUEUE_RESOURCE_COLUMNS.map((resource) => {
        const stats = getQueueResourceStats(queue, resource);
        return {
            resource,
            stats: {
                ...stats,
                capabilityLabel: formatResourceMetric(
                    stats.capabilityLabel,
                    resource,
                ),
                deservedLabel: formatResourceMetric(
                    stats.deservedLabel,
                    resource,
                ),
                guaranteeLabel: formatResourceMetric(
                    stats.guaranteeLabel,
                    resource,
                ),
                usedLabel: formatResourceMetric(stats.usedLabel, resource),
            },
            valueText: formatResourceValueText(stats, resource),
        };
    });

export const getQueueResourceDetail = (queue, resource, mode) => {
    const stats = getQueueResourceStats(queue, resource);
    return {
        resource,
        scaleLabels: [
            "0",
            formatResourceMetric(stats.guaranteeLabel, resource),
            formatResourceMetric(stats.deservedLabel, resource),
            formatResourceMetric(stats.capabilityLabel, resource),
        ],
        stats,
        valueText:
            mode === "percentage"
                ? `${stats.usageLabel} used / deserved`
                : formatResourceValueText(stats, resource),
    };
};

export const getQueueUsageSummary = (queue) => {
    const stats = QUEUE_RESOURCE_COLUMNS.map((resource) => ({
        ...getQueueResourceStats(queue, resource),
        label: resource.label,
    }));
    const deservedTotal = stats.reduce((sum, item) => sum + item.deserved, 0);
    const usedTotal = stats.reduce((sum, item) => sum + item.used, 0);
    const usagePercent = deservedTotal
        ? Math.round((usedTotal / deservedTotal) * 100)
        : 0;

    return { stats, usagePercent };
};
