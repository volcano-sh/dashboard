// Prioritize using the port in the environment variable, if not, use the default port 3001
const getServerPort = () => {
    return process.env.APP_SERVER_PORT || "3001";
};

// Build API base URL
const API_CONFIG = {
    baseURL: `http://localhost:${getServerPort()}`,
};

//API endpoint configuration
export const API_ENDPOINTS = {
    jobs: {
        list: `${API_CONFIG.baseURL}/api/jobs`,
        detail: (namespace, name) =>
            `${API_CONFIG.baseURL}/jobs/${namespace}/${name}`,
    },
    queues: {
        list: `${API_CONFIG.baseURL}/api/queues`,
    },
    pods: {
        list: `${API_CONFIG.baseURL}/api/pods`,
    },
};

export default API_CONFIG;
