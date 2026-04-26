import axios from "axios";

export const API_BASE = "/api/v1";

export const fetchJobs = async (params) => {
    const response = await axios.get(`${API_BASE}/jobs`, { params });
    return response.data;
};

export const createJob = async (job) => {
    const response = await axios.post(`${API_BASE}/jobs`, job, {
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
};

export const fetchJobYaml = async (namespace, name) => {
    const response = await axios.get(
        `${API_BASE}/jobs/${namespace}/${name}/yaml`,
        {
            responseType: "text",
        },
    );
    return response.data;
};

export const fetchJob = async (namespace, name) => {
    const response = await axios.get(`${API_BASE}/jobs/${namespace}/${name}`);
    return response.data;
};

export const fetchJobEvents = async (namespace, name) => {
    const response = await axios.get(
        `${API_BASE}/jobs/${namespace}/${name}/events`,
    );
    return response.data;
};

export const fetchPodGroups = async (params) => {
    const response = await axios.get(`${API_BASE}/podgroups`, { params });
    return response.data;
};

export const fetchPodGroupYaml = async (namespace, name) => {
    const response = await axios.get(
        `${API_BASE}/podgroups/${namespace}/${name}/yaml`,
        {
            responseType: "text",
        },
    );
    return response.data;
};

export const fetchPodGroup = async (namespace, name) => {
    const response = await axios.get(
        `${API_BASE}/podgroups/${namespace}/${name}`,
    );
    return response.data;
};

export const fetchPods = async (params) => {
    const response = await axios.get(`${API_BASE}/pods`, { params });
    return response.data;
};

export const createPod = async (pod) => {
    const response = await axios.post(`${API_BASE}/pods`, pod, {
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
};

export const fetchPodYaml = async (namespace, name) => {
    const response = await axios.get(
        `${API_BASE}/pods/${namespace}/${name}/yaml`,
        {
            responseType: "text",
        },
    );
    return response.data;
};

export const fetchPod = async (namespace, name) => {
    const response = await axios.get(`${API_BASE}/pods/${namespace}/${name}`);
    return response.data;
};

export const fetchPodLogs = async (namespace, name, params = {}) => {
    const response = await axios.get(
        `${API_BASE}/pods/${namespace}/${name}/logs`,
        {
            params,
            responseType: "text",
        },
    );
    return response.data;
};

export const fetchPodEvents = async (namespace, name) => {
    const response = await axios.get(
        `${API_BASE}/pods/${namespace}/${name}/events`,
    );
    return response.data;
};

export const deletePod = async (namespace, name) => {
    const response = await axios.delete(
        `${API_BASE}/pods/${namespace}/${name}`,
    );
    return response.data;
};

export const fetchNamespaces = async () => {
    const response = await axios.get(`${API_BASE}/namespaces`);
    const items = response.data?.items || [];
    return ["All", ...new Set(items.map((item) => item.metadata.name))];
};

export const fetchQueues = async () => {
    const response = await axios.get(`${API_BASE}/queues`);
    const items = response.data?.items || [];
    return ["All", ...new Set(items.map((item) => item.metadata.name))];
};

export const fetchQueueList = async (params) => {
    const response = await axios.get(`${API_BASE}/queues`, { params });
    return response.data;
};

export const fetchQueueYaml = async (name) => {
    const response = await axios.get(`${API_BASE}/queues/${name}/yaml`, {
        responseType: "text",
    });
    return response.data;
};

export const fetchSchedulerConfig = async () => {
    const response = await axios.get(`${API_BASE}/scheduler/config`);
    return response.data;
};

export const fetchSchedulerConfigYaml = async () => {
    const response = await axios.get(`${API_BASE}/scheduler/config/yaml`, {
        responseType: "text",
    });
    return response.data;
};

export const fetchClusterInfo = async () => {
    const response = await axios.get(`${API_BASE}/cluster-info`);
    return response.data;
};

export const getApiErrorMessage = (error, fallback) => {
    const apiMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.statusText ||
        error?.message;

    return `${fallback}: ${apiMessage || "Unknown error"}`;
};
