import axios from "axios";

export const fetchJobs = async (params) => {
    const response = await axios.get("/api/jobs", { params });
    return response.data;
};

export const createJob = async (job) => {
    const response = await axios.post("/api/jobs", job, {
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
};

export const fetchJobYaml = async (namespace, name) => {
    const response = await axios.get(`/api/jobs/${namespace}/${name}/yaml`, {
        responseType: "text",
    });
    return response.data;
};

export const fetchPodGroups = async (params) => {
    const response = await axios.get("/api/podgroups", { params });
    return response.data;
};

export const fetchPodGroupYaml = async (namespace, name) => {
    const response = await axios.get(
        `/api/podgroups/${namespace}/${name}/yaml`,
        {
            responseType: "text",
        },
    );
    return response.data;
};

export const fetchPods = async (params) => {
    const response = await axios.get("/api/pods", { params });
    return response.data;
};

export const createPod = async (pod) => {
    const response = await axios.post("/api/pods", pod, {
        headers: { "Content-Type": "application/json" },
    });
    return response.data;
};

export const fetchPodYaml = async (namespace, name) => {
    const response = await axios.get(`/api/pods/${namespace}/${name}/yaml`, {
        responseType: "text",
    });
    return response.data;
};

export const fetchNamespaces = async () => {
    const response = await axios.get("/api/namespaces");
    const items = response.data?.items || [];
    return ["All", ...new Set(items.map((item) => item.metadata.name))];
};

export const fetchQueues = async () => {
    const response = await axios.get("/api/queues");
    const items = response.data?.items || [];
    return ["All", ...new Set(items.map((item) => item.metadata.name))];
};

export const fetchQueueList = async (params) => {
    const response = await axios.get("/api/queues", { params });
    return response.data;
};

export const fetchQueueYaml = async (name) => {
    const response = await axios.get(`/api/queues/${name}/yaml`, {
        responseType: "text",
    });
    return response.data;
};

export const fetchSchedulerConfig = async () => {
    const response = await axios.get("/api/scheduler/config");
    return response.data;
};

export const fetchSchedulerConfigYaml = async () => {
    const response = await axios.get("/api/scheduler/config/yaml", {
        responseType: "text",
    });
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
