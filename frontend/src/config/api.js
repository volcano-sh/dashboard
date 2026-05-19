import axios from 'axios'

const apiClient = axios.create({
    baseURL: '/api'
})

export const API_ENDPOINTS = {
    jobs: {
        list: '/jobs',
        detail: (namespace, name) => `/jobs/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
        yaml: (namespace, name) => `/job/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/yaml`,
    },
    queues: {
        list: '/queues',
        all: '/all-queues',
        detail: (name) => `/queues/${encodeURIComponent(name)}`,
    },
    pods: {
        list: '/pods',
        yaml: (namespace, name) => `/pod/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/yaml`,

    },
    podgroups: {
        list: '/podgroups',
    },
    namespaces: {
        list: '/namespaces',
    },
}

export default apiClient