import axios from 'axios'

// Single axios instance — works in dev (Vite proxy) and production (Nginx)
const apiClient = axios.create({
    baseURL: '/api'
})

export const API_ENDPOINTS = {
    jobs: {
        list: '/jobs',
        detail: (namespace, name) => `/jobs/${namespace}/${name}`,
    },
    queues: {
        list: '/queues',
    },
    pods: {
        list: '/pods',
    },
    podgroups: {
        list: '/podgroups',
    },
}

export default apiClient