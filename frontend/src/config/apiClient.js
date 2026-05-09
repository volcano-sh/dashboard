import axios from "axios";

const apiClient = axios.create({
    baseURL: "/",
});

apiClient.interceptors.request.use((config) => {
    const clusterContext = localStorage.getItem("currentCluster") || "default";
    config.headers["X-Cluster-Context"] = clusterContext;
    return config;
});

export default apiClient;
