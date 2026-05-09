import {
    CoreV1Api,
    CustomObjectsApi,
    KubeConfig,
} from "@kubernetes/client-node";

class K8sService {
    constructor() {
        this.clientsMap = new Map();
        this.defaultKc = new KubeConfig();
        this.defaultKc.loadFromDefault();
    }

    getClients(contextName) {
        if (!contextName || contextName === "default") {
            const kc = this.defaultKc;
            return {
                k8sApi: kc.makeApiClient(CustomObjectsApi),
                k8sCoreApi: kc.makeApiClient(CoreV1Api),
            };
        }

        if (this.clientsMap.has(contextName)) {
            return this.clientsMap.get(contextName);
        }

        const kc = new KubeConfig();
        kc.loadFromDefault();
        kc.setCurrentContext(contextName);
        const clients = {
            k8sApi: kc.makeApiClient(CustomObjectsApi),
            k8sCoreApi: kc.makeApiClient(CoreV1Api),
        };
        this.clientsMap.set(contextName, clients);
        return clients;
    }

    // JOBS
    async listJobs(contextName, namespace, searchTerm, queueFilter, statusFilter) {
        const { k8sApi } = this.getClients(contextName);
        let response;
        if (namespace === "" || namespace === "All") {
            response = await this.k8sApi.listClusterCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                plural: "jobs",
                pretty: true,
            });
        } else {
            response = await this.k8sApi.listNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                pretty: true,
            });
        }

        let filteredJobs = response.items || [];

        if (searchTerm) {
            filteredJobs = filteredJobs.filter((job) =>
                job.metadata.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        if (queueFilter && queueFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.spec.queue === queueFilter,
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.status?.state?.phase === statusFilter,
            );
        }

        return {
            items: filteredJobs,
            totalCount: filteredJobs.length,
        };
    }

    async getJob(contextName, namespace, name) {
        const { k8sApi } = this.getClients(contextName);
        return await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
    }

    async createJob(contextName, jobManifest) {
        const { k8sApi } = this.getClients(contextName);
        const namespace = jobManifest.metadata.namespace || "default";
        return await k8sApi.createNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            body: jobManifest,
        });
    }

    async patchJob(contextName, namespace, name, patchData) {
        const { k8sApi } = this.getClients(contextName);
        const options = {
            headers: { "Content-Type": "application/merge-patch+json" },
        };
        return await k8sApi.patchNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
            body: patchData,
            options,
        });
    }

    // PODGROUPS
    async listPodGroups(contextName, namespace, searchTerm, statusFilter) {
        const { k8sApi } = this.getClients(contextName);
        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "podgroups",
            });
        } else {
            response = await this.k8sApi.listNamespacedCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                namespace,
                plural: "podgroups",
            });
        }

        let filteredPodGroups = response.items || [];

        if (searchTerm) {
            filteredPodGroups = filteredPodGroups.filter((pg) =>
                pg.metadata.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredPodGroups = filteredPodGroups.filter(
                (pg) => pg.status?.phase === statusFilter,
            );
        }

        return {
            items: filteredPodGroups,
            totalCount: filteredPodGroups.length,
        };
    }

    async getPodGroup(contextName, namespace, name) {
        const { k8sApi } = this.getClients(contextName);
        return await k8sApi.getNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            namespace,
            plural: "podgroups",
            name,
        });
    }

    // QUEUES
    async listQueues(contextName, page, limit, searchTerm, stateFilter) {
        const { k8sApi } = this.getClients(contextName);
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });

        let filteredQueues = response.items || [];

        if (searchTerm) {
            filteredQueues = filteredQueues.filter((queue) =>
                queue.metadata.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        if (stateFilter && stateFilter !== "All") {
            filteredQueues = filteredQueues.filter(
                (pod) => pod.status?.state === stateFilter,
            );
        }

        const totalCount = filteredQueues.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalCount);
        const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

        return {
            items: paginatedQueues,
            totalCount: totalCount,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalCount / limit),
        };
    }

    async getQueue(contextName, name) {
        const { k8sApi } = this.getClients(contextName);
        return await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });
    }

    async patchQueue(contextName, name, patchData) {
        const { k8sApi } = this.getClients(contextName);
        const options = {
            headers: { "Content-Type": "application/merge-patch+json" },
        };
        return await k8sApi.patchClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
            body: patchData,
            options,
        });
    }

    // PODS
    async listPods(contextName, namespace, searchTerm, statusFilter) {
        const { k8sCoreApi } = this.getClients(contextName);
        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sCoreApi.listPodForAllNamespaces();
        } else {
            response = await k8sCoreApi.listNamespacedPod({ namespace });
        }

        let filteredPods = response.items || [];

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filteredPods = filteredPods.filter((pod) => {
                const podName = pod.metadata.name.toLowerCase();
                const podNamespace = pod.metadata.namespace.toLowerCase();
                return (
                    podName.includes(searchLower) ||
                    podNamespace.includes(searchLower)
                );
            });
        }

        if (statusFilter && statusFilter !== "All") {
            filteredPods = filteredPods.filter(
                (pod) => pod.status.phase === statusFilter,
            );
        }

        filteredPods.sort((a, b) => {
            return (
                new Date(b.metadata.creationTimestamp) -
                new Date(a.metadata.creationTimestamp)
            );
        });

        return {
            items: filteredPods,
            totalCount: filteredPods.length,
        };
    }

    async readPod(contextName, namespace, name) {
        const { k8sCoreApi } = this.getClients(contextName);
        return await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });
    }

    async createPod(contextName, namespace, podManifest) {
        const { k8sCoreApi } = this.getClients(contextName);
        return await k8sCoreApi.createNamespacedPod({
            namespace,
            body: podManifest,
        });
    }

    // NAMESPACES
    async listNamespaces(contextName) {
        const { k8sCoreApi } = this.getClients(contextName);
        const response = await k8sCoreApi.listNamespace();
        return {
            items: response.items,
        };
    }
}

export default new K8sService();
