import { API_BASE } from "../lib/client/dashboard-api";
import { getStoredToken } from "../lib/client/auth-token";

const authorizationHeaders = () => {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchAllQueues = async () => {
    try {
        const response = await fetch(`${API_BASE}/queues`, {
            headers: authorizationHeaders(),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return [
            "All",
            ...new Set(data.items.map((item) => item.metadata.name)),
        ];
    } catch (error) {
        console.error("Error fetching queues:", error);
        return [];
    }
};

export const calculateAge = (creationTimestamp) => {
    const created = new Date(creationTimestamp);
    const now = new Date();
    const diffInSeconds = Math.floor(
        (now.getTime() - created.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
};

export const parseCPU = (cpu) => {
    if (cpu.endsWith("m")) {
        return parseFloat(cpu.slice(0, -1));
    }
    return parseFloat(cpu) * 1000;
};

export const parseMemoryToMi = (memoryStr) => {
    if (!memoryStr) return 0;
    const value = parseInt(memoryStr);
    if (memoryStr.includes("Gi")) return value * 1024;
    if (memoryStr.includes("Mi")) return value;
    if (memoryStr.includes("Ki")) return value / 1024;
    return value / 1024 / 1024; // default Bi
};
