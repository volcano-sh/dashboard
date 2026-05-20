const formatResource = (value, fallback = "0") => {
    if (value === undefined || value === null || value === "") return fallback;
    return String(value);
};

const MEMORY_UNITS_TO_BYTES = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
};

export const QUEUE_RESOURCE_COLUMNS = [
    {
        key: "cpu",
        label: "CPU",
        unit: "cores",
    },
    {
        key: "memory",
        label: "Memory",
        unit: "bytes",
    },
    {
        key: "pods",
        label: "Pods",
        resourceKey: "pods",
        unit: "pods",
    },
];

export const formatCpuFromMilli = (milli) => {
    const value = Number(milli || 0) / 1000;
    if (!value) return "0 cores";
    return `${Number(value.toFixed(3)).toString()} cores`;
};

export const formatMemoryBytes = (bytes) => {
    const value = Number(bytes || 0);
    if (!value) return "0 B";
    if (value >= 1024 ** 3) {
        return `${Number((value / 1024 ** 3).toFixed(2)).toString()} GiB`;
    }
    if (value >= 1024 ** 2) {
        return `${Number((value / 1024 ** 2).toFixed(2)).toString()} MiB`;
    }
    if (value >= 1024) {
        return `${Number((value / 1024).toFixed(2)).toString()} KiB`;
    }
    return `${value} B`;
};

export const formatShare = (value) => {
    if (value === undefined || value === null || value === "") return "-";
    return `${Number((Number(value) * 100).toFixed(2)).toString()}%`;
};

export const formatResourceValue = (resourceName, value) => {
    if (resourceName === "cpu") return formatCpuFromMilli(value);
    if (resourceName === "memory") return formatMemoryBytes(value);
    if (value === undefined || value === null || value === "") return "0";
    return Number(value).toString();
};

const parseSpecResourceNumber = (value, resource) => {
    const text = String(value || "0").trim();
    if (!text) return 0;

    if (resource.key === "memory") {
        const match = text.match(/^([0-9.]+)\s*([KMGTP]i)?$/);
        if (match) {
            const amount = Number.parseFloat(match[1]);
            const unit = match[2] || "Gi";
            return Number.isFinite(amount)
                ? amount * (MEMORY_UNITS_TO_BYTES[unit] ?? 1)
                : 0;
        }
    }

    if (resource.key === "cpu" && text.endsWith("m")) {
        const amount = Number.parseFloat(text.slice(0, -1));
        return Number.isFinite(amount) ? amount : 0;
    }

    const parsed = Number.parseFloat(text.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(parsed)) return 0;
    return resource.key === "cpu" ? parsed * 1000 : parsed;
};

const getSpecResource = (queue, key, resourceKey) => {
    const section = queue?.spec?.[key];
    if (!section) return undefined;
    return section?.resource?.[resourceKey] || section?.[resourceKey];
};

const getCapabilityRaw = (queue, resource) =>
    getSpecResource(queue, "capability", resource.resourceKey || resource.key);

const getMetricValue = (queue, resource, field) => {
    const metrics = queue?.summary?.schedulerMetrics;
    if (resource.key === "cpu") return metrics?.cpu?.[`${field}Milli`] ?? 0;
    if (resource.key === "memory")
        return metrics?.memory?.[`${field}Bytes`] ?? 0;
    return metrics?.scalar?.[resource.resourceKey || resource.key]?.[field] ?? 0;
};

const getCapability = (queue, resource) => {
    const raw = getCapabilityRaw(queue, resource);
    return parseSpecResourceNumber(raw, resource);
};

const formatCapability = (queue, resource) => {
    const raw = getCapabilityRaw(queue, resource);
    if (raw === undefined || raw === null || raw === "") return "-";
    if (resource.key === "cpu") return formatCpuFromMilli(getCapability(queue, resource));
    if (resource.key === "memory") return formatMemoryBytes(getCapability(queue, resource));
    return formatResource(raw, "-");
};

export const getQueueResourceStats = (queue, resource) => {
    const requested = getMetricValue(queue, resource, "requested");
    const allocated = getMetricValue(queue, resource, "allocated");
    const deserved = getMetricValue(queue, resource, "deserved");
    const capability = getCapability(queue, resource);
    const scale = Math.max(capability, deserved, requested, allocated, 1);
    const usagePercent = deserved ? (allocated / deserved) * 100 : 0;
    const guaranteePercent = Math.min((requested / scale) * 100, 100);
    const deservedPercent = Math.min((deserved / scale) * 100, 100);
    const usedPercent = Math.min((allocated / scale) * 100, 100);
    const overCapability = Boolean(capability && allocated > capability);
    const usageTone = overCapability
        ? "hot"
        : !allocated && !requested
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
        capabilityLabel: formatCapability(queue, resource),
        deserved,
        deservedLabel: formatResourceValue(resource.key, deserved),
        deservedPercent,
        guarantee: requested,
        guaranteeLabel: formatResourceValue(resource.key, requested),
        guaranteePercent,
        overCapability,
        pendingLabel: "0",
        requested,
        requestedLabel: formatResourceValue(resource.key, requested),
        scale,
        usageLabel: deserved ? `${Math.round(usagePercent)}%` : "0%",
        usagePercent,
        usageTone,
        used: allocated,
        usedLabel: formatResourceValue(resource.key, allocated),
        usedPercent,
    };
};

export const formatResourceValueText = (stats) =>
    `${stats.usedLabel} / ${stats.deservedLabel} (${stats.usageLabel})`;

export const getQueueResourceStatusItems = (queue) =>
    QUEUE_RESOURCE_COLUMNS.map((resource) => {
        const stats = getQueueResourceStats(queue, resource);
        return {
            resource,
            stats,
            valueText: formatResourceValueText(stats),
        };
    });

export const getQueueResourceDetail = (queue, resource, mode) => {
    const stats = getQueueResourceStats(queue, resource);
    return {
        resource,
        scaleLabels: [
            "0",
            stats.requestedLabel,
            stats.deservedLabel,
            stats.capabilityLabel,
        ],
        stats,
        valueText:
            mode === "percentage"
                ? `${stats.usageLabel} allocated / deserved`
                : formatResourceValueText(stats),
    };
};

export const getQueueUsageSummary = (queue) => {
    const stats = QUEUE_RESOURCE_COLUMNS.map((resource) => ({
        ...getQueueResourceStats(queue, resource),
        label: resource.label,
    }));
    const deservedTotal = stats.reduce((sum, item) => sum + item.deserved, 0);
    const allocatedTotal = stats.reduce((sum, item) => sum + item.used, 0);
    const usagePercent = deservedTotal
        ? Math.round((allocatedTotal / deservedTotal) * 100)
        : 0;

    return { stats, usagePercent };
};
