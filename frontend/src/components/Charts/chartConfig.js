export const CHART_COLORS = {
    primary: '#3b82f6',      // Blue
    secondary: '#1e40af',    // Dark Blue
    success: '#10b981',      // Green
    warning: '#f59e0b',      // Amber
    danger: '#ef4444',       // Red
    white: '#ffffff',
    gray: '#64748b'
};

export const CHART_DIMENSIONS = {
    PIE_CHART: {
        height: 240,
        outerRadius: 80,
        innerRadius: 35
    },
    BAR_CHART: {
        height: 240,
        margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }
};

// Resource conversion utilities
export const convertMemoryToGi = (memoryStr) => {
    if (!memoryStr) return 0;
    const value = parseInt(memoryStr);
    if (memoryStr.includes("Gi")) return value;
    if (memoryStr.includes("Mi")) return value / 1024;
    if (memoryStr.includes("Ki")) return value / 1024 / 1024;
    return value;
};

export const convertCPUToCores = (cpuStr) => {
    if (!cpuStr) return 0;
    const value = parseInt(cpuStr);
    if (typeof cpuStr === "number") return cpuStr;
    return cpuStr.includes("m") ? value / 1000 : value;
};

export const getResourceUnit = (selectedResource) => {
    switch (selectedResource) {
        case 'memory': return 'Gi';
        case 'cpu': return 'cores';
        case 'pods': return 'pods';
        default: return '';
    }
};