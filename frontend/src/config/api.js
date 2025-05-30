// Simple API Configuration for Volcano Dashboard (Browser Compatible)

// Use your existing pattern but make it browser-compatible
const getServerPort = () => {
    // For Vite-based projects, use VITE_ prefix
    return import.meta.env?.VITE_APP_SERVER_PORT || "3001";
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
            `${API_CONFIG.baseURL}/api/jobs/${namespace}/${name}`,
    },
    queues: {
        list: `${API_CONFIG.baseURL}/api/queues`,
    },
    pods: {
        list: `${API_CONFIG.baseURL}/api/pods`,
    },
};

// Simple fetch wrapper for better error handling
export const apiClient = {
    async get(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    },

    async post(url, data, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers,
                },
                body: JSON.stringify(data),
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    },
};

export default API_CONFIG;