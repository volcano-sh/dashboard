import axios from "axios";
import { INamespace, IQueue } from "../types";

export const fetchAllNamespaces = async () => {
    try {
        const response = await axios.get(`/api/namespaces`);
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = response.data as { items: INamespace[] };

        return ["All", ...new Set(data.items.map(item => item.metadata?.name!))];
    } catch (error) {
        console.error("Error fetching namespaces:", error);
        return [];
    }
};

export const fetchAllQueues = async () => {
    try {
        const response = await axios.get(`/api/all-queues`);
        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = response.data as {
            items: IQueue[],
            totalCount: number
        }

        return ["All", ...new Set(data.items.map(item => item.metadata?.name!))];
    } catch (error) {
        console.error("Error fetching queues:", error);
        return [];
    }
};

export const calculateAge = (creationTimestamp: Date) => {
    const created = new Date(creationTimestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

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

export const parseCPU = (cpu: string) => {
    if (cpu.endsWith("m")) {
        return parseFloat(cpu.slice(0, -1));
    }
    return parseFloat(cpu) * 1000;
};

export const parseMemoryToMi = (memoryStr: string) => {
    if (!memoryStr) return 0;
    const value = parseInt(memoryStr);
    if (memoryStr.includes('Gi')) return value * 1024;
    if (memoryStr.includes('Mi')) return value;
    if (memoryStr.includes('Ki')) return value / 1024;
    return value / 1024 / 1024; // default Bi
};