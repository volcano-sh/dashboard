import { NextResponse } from "next/server";
import {
    getErrorMessage,
    getErrorStatus,
    getKubernetesClients,
    yamlResponse,
} from "./kubernetes";

const json = (data, status = 200) => NextResponse.json(data, { status });

const text = (data, status = 200, contentType = "text/yaml") =>
    new NextResponse(data, {
        status,
        headers: { "Content-Type": contentType },
    });

const queryValue = (searchParams, key, fallback = "") =>
    searchParams.get(key) ?? fallback;

const toInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getApis = () => {
    const { k8sApi, k8sCoreApi } = getKubernetesClients();
    return { k8sApi, k8sCoreApi };
};

function filterBySearch(items, searchTerm) {
    if (!searchTerm) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) =>
        item.metadata?.name?.toLowerCase().includes(query),
    );
}

function getJobState(job) {
    if (job.status?.state) return job.status.state;
    if (job.status === "Running") return "Running";
    if (job.status === "Completed") return "Completed";
    if (job.status === "Failed") return "Failed";
    if (job.status === "Pending") return "Running";
    return job.status || "Unknown";
}

async function listJobs(request) {
    try {
        const { k8sApi } = getApis();
        const { searchParams } = new URL(request.url);
        const namespace = queryValue(searchParams, "namespace");
        const searchTerm = queryValue(searchParams, "search");
        const queueFilter = queryValue(searchParams, "queue");
        const statusFilter = queryValue(searchParams, "status");

        const response =
            namespace === "" || namespace === "All"
                ? await k8sApi.listClusterCustomObject({
                      group: "batch.volcano.sh",
                      version: "v1alpha1",
                      plural: "jobs",
                      pretty: true,
                  })
                : await k8sApi.listNamespacedCustomObject({
                      group: "batch.volcano.sh",
                      version: "v1alpha1",
                      namespace,
                      plural: "jobs",
                      pretty: true,
                  });

        let items = response.items || [];
        items = filterBySearch(items, searchTerm);

        if (queueFilter && queueFilter !== "All") {
            items = items.filter((job) => job.spec?.queue === queueFilter);
        }
        if (statusFilter && statusFilter !== "All") {
            items = items.filter(
                (job) => job.status?.state?.phase === statusFilter,
            );
        }

        return json({ items, totalCount: items.length });
    } catch (error) {
        return json(
            {
                error: "Failed to fetch jobs",
                details: getErrorMessage(error, "Failed to fetch jobs"),
            },
            getErrorStatus(error),
        );
    }
}

async function getJob(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
        return json(response);
    } catch (error) {
        return json(
            {
                error: "Failed to fetch job",
                details: getErrorMessage(error, "Failed to fetch job"),
            },
            getErrorStatus(error),
        );
    }
}

async function getJobYaml(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
        return text(yamlResponse(response));
    } catch (error) {
        return json(
            {
                error: "Failed to fetch job YAML",
                details: getErrorMessage(error, "Failed to fetch job YAML"),
            },
            getErrorStatus(error),
        );
    }
}

async function createJob(request) {
    try {
        const { k8sApi } = getApis();
        const jobManifest = await request.json();
        if (!jobManifest?.metadata?.name || !jobManifest?.spec) {
            return json({ error: "Invalid job manifest" }, 400);
        }

        const namespace = jobManifest.metadata.namespace || "default";
        const response = await k8sApi.createNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            body: jobManifest,
        });

        return json(
            {
                message: "Job created successfully",
                data: response.body,
            },
            201,
        );
    } catch (error) {
        return json(
            { error: getErrorMessage(error, "Failed to create job") },
            getErrorStatus(error),
        );
    }
}

async function patchJob(request, namespace, name) {
    try {
        const { k8sApi } = getApis();
        const patchData = await request.json();
        const response = await k8sApi.patchNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
            body: patchData,
            options: {
                headers: { "Content-Type": "application/merge-patch+json" },
            },
        });

        return json({
            message: "Job updated successfully",
            data: response.body,
        });
    } catch (error) {
        return json({ error: "Failed to update job" }, getErrorStatus(error));
    }
}

async function deleteJob(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.deleteNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
            body: { propagationPolicy: "Foreground" },
        });

        return json({
            message: "Job deleted successfully",
            data: response.body,
        });
    } catch (error) {
        return json(
            {
                error: error?.body?.reason || "KubernetesError",
                message: getErrorMessage(error, "Failed to delete job"),
                code: getErrorStatus(error),
                k8s: error?.body || error?.response?.body,
            },
            getErrorStatus(error),
        );
    }
}

async function listPodGroups(request) {
    try {
        const { k8sApi } = getApis();
        const { searchParams } = new URL(request.url);
        const namespace = queryValue(searchParams, "namespace");
        const searchTerm = queryValue(searchParams, "search");
        const statusFilter = queryValue(searchParams, "status");

        const response =
            namespace === "" || namespace === "All"
                ? await k8sApi.listClusterCustomObject({
                      group: "scheduling.volcano.sh",
                      version: "v1beta1",
                      plural: "podgroups",
                  })
                : await k8sApi.listNamespacedCustomObject({
                      group: "scheduling.volcano.sh",
                      version: "v1beta1",
                      namespace,
                      plural: "podgroups",
                  });

        let items = response.items || [];
        items = filterBySearch(items, searchTerm);

        if (statusFilter && statusFilter !== "All") {
            items = items.filter((pg) => pg.status?.phase === statusFilter);
        }

        return json({ items, totalCount: items.length });
    } catch (error) {
        return json(
            {
                error: "Failed to fetch podgroups",
                details: getErrorMessage(error, "Failed to fetch podgroups"),
            },
            getErrorStatus(error),
        );
    }
}

async function getPodGroup(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            namespace,
            plural: "podgroups",
            name,
        });
        return json(response);
    } catch (error) {
        return json(
            {
                error: "Failed to fetch podgroup",
                details: getErrorMessage(error, "Failed to fetch podgroup"),
            },
            getErrorStatus(error),
        );
    }
}

async function getPodGroupYaml(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            namespace,
            plural: "podgroups",
            name,
        });
        return text(yamlResponse(response));
    } catch (error) {
        return json(
            {
                error: "Failed to fetch podgroup YAML",
                details: getErrorMessage(
                    error,
                    "Failed to fetch podgroup YAML",
                ),
            },
            getErrorStatus(error),
        );
    }
}

async function listQueues(request) {
    try {
        const { k8sApi } = getApis();
        const { searchParams } = new URL(request.url);
        const page = toInt(queryValue(searchParams, "page"), 1);
        const limit = toInt(queryValue(searchParams, "limit"), 10);
        const searchTerm = queryValue(searchParams, "search");
        const stateFilter = queryValue(searchParams, "state");

        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });

        let items = response.items || [];
        items = filterBySearch(items, searchTerm);
        if (stateFilter && stateFilter !== "All") {
            items = items.filter(
                (queue) => queue.status?.state === stateFilter,
            );
        }

        const totalCount = items.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalCount);

        return json({
            items: items.slice(startIndex, endIndex),
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        return json(
            {
                error: "Failed to fetch queues",
                details: getErrorMessage(error, "Failed to fetch queues"),
            },
            getErrorStatus(error),
        );
    }
}

async function getQueue(name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });
        return json(response);
    } catch (error) {
        return json(
            { error: "Failed to fetch queue details" },
            getErrorStatus(error),
        );
    }
}

async function getQueueYaml(name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });
        return text(yamlResponse(response));
    } catch (error) {
        return json(
            {
                error: "Failed to fetch job YAML",
                details: getErrorMessage(error, "Failed to fetch job YAML"),
            },
            getErrorStatus(error),
        );
    }
}

async function updateQueue(request, name) {
    try {
        const { k8sApi } = getApis();
        const updatedBody = await request.json();
        if (!updatedBody.spec || Object.keys(updatedBody.spec).length === 0) {
            return json(
                {
                    error: "Bad Request",
                    details: "spec object is required and cannot be empty",
                },
                400,
            );
        }

        await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });

        const numericFields = new Set(["weight"]);
        const patchOperations = [];
        Object.entries(updatedBody.spec).forEach(([key, value]) => {
            let patchValue = value;
            if (numericFields.has(key) && typeof patchValue === "string") {
                const parsed = Number.parseInt(patchValue, 10);
                if (!Number.isNaN(parsed)) {
                    patchValue = parsed;
                }
            }
            patchOperations.push({
                op: "replace",
                path: `/spec/${key}`,
                value: patchValue,
            });
        });

        const response = await k8sApi.patchClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
            body: patchOperations,
            options: {
                headers: {
                    "Content-Type": "application/json-patch+json",
                },
            },
        });

        const updatedQueue = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });

        return json({
            message: `Successfully updated queue ${name}`,
            patchResponse: response.body,
            updatedQueue: updatedQueue.body,
        });
    } catch (error) {
        return json(
            {
                error: `Failed to update queue ${name}`,
                details: getErrorMessage(
                    error,
                    `Failed to update queue ${name}`,
                ),
                rawError: error.toString(),
            },
            getErrorStatus(error),
        );
    }
}

async function createQueue(request) {
    try {
        const { k8sApi } = getApis();
        const queueManifest = await request.json();
        if (!queueManifest?.metadata?.name || !queueManifest?.spec) {
            return json({ error: "Invalid queue manifest" }, 400);
        }
        const customAnnotations = queueManifest.annotations || {};
        queueManifest.metadata.annotations = {
            ...(queueManifest.metadata.annotations || {}),
            ...customAnnotations,
        };

        const response = await k8sApi.createClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            body: queueManifest,
        });

        return json(
            { message: "Queue created successfully", data: response.body },
            201,
        );
    } catch (error) {
        return json(
            { error: getErrorMessage(error, "Failed to create queue") },
            getErrorStatus(error),
        );
    }
}

async function deleteQueue(name) {
    try {
        const { k8sApi } = getApis();
        await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: name.toLowerCase(),
        });

        const { body } = await k8sApi.deleteClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: name.toLowerCase(),
            body: { propagationPolicy: "Foreground" },
        });

        return json({ message: "Queue deleted successfully", data: body });
    } catch (error) {
        return json(
            {
                error: "Kubernetes Error",
                details: getErrorMessage(
                    error,
                    "An unexpected error occurred.",
                ),
            },
            getErrorStatus(error),
        );
    }
}

async function listNamespaces() {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.listNamespace();
        return json({ items: response.items });
    } catch (error) {
        return json(
            {
                error: "Failed to fetch namespaces",
                details: getErrorMessage(error, "Failed to fetch namespaces"),
            },
            getErrorStatus(error),
        );
    }
}

async function listPods(request) {
    try {
        const { k8sCoreApi } = getApis();
        const { searchParams } = new URL(request.url);
        const namespace = queryValue(searchParams, "namespace");
        const searchTerm = queryValue(searchParams, "search");
        const statusFilter = queryValue(searchParams, "status");

        const response =
            namespace === "" || namespace === "All"
                ? await k8sCoreApi.listPodForAllNamespaces()
                : await k8sCoreApi.listNamespacedPod({ namespace });

        let items = response.items || [];
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            items = items.filter((pod) => {
                const podName = pod.metadata?.name?.toLowerCase() || "";
                const podNamespace =
                    pod.metadata?.namespace?.toLowerCase() || "";
                return podName.includes(query) || podNamespace.includes(query);
            });
        }
        if (statusFilter && statusFilter !== "All") {
            items = items.filter((pod) => pod.status?.phase === statusFilter);
        }

        items.sort(
            (a, b) =>
                new Date(b.metadata.creationTimestamp) -
                new Date(a.metadata.creationTimestamp),
        );

        return json({ items, totalCount: items.length });
    } catch (error) {
        return json(
            {
                error: "Failed to fetch pods",
                details: getErrorMessage(error, "Failed to fetch pods"),
            },
            getErrorStatus(error),
        );
    }
}

async function getPodYaml(namespace, name) {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });
        return text(yamlResponse(response));
    } catch (error) {
        return json(
            {
                error: "Failed to fetch job YAML",
                details: getErrorMessage(error, "Failed to fetch job YAML"),
            },
            getErrorStatus(error),
        );
    }
}

async function createPod(request) {
    try {
        const { k8sCoreApi } = getApis();
        const podManifest = await request.json();
        if (!podManifest?.metadata?.name || !podManifest?.spec) {
            return json({ error: "Invalid pod manifest" }, 400);
        }
        if (podManifest.apiVersion === "scheduling.volcano.sh/v1beta1") {
            podManifest.apiVersion = "v1";
        }
        if (podManifest.kind !== "Pod") {
            podManifest.kind = "Pod";
        }
        if (podManifest.spec.weight || podManifest.spec.reclaimable) {
            return json(
                {
                    error: "Invalid Pod spec. Use proper Pod specification with containers, not Queue fields.",
                },
                400,
            );
        }
        if (
            !podManifest.spec.containers ||
            !Array.isArray(podManifest.spec.containers)
        ) {
            return json(
                { error: "Pod spec must include 'containers' array" },
                400,
            );
        }

        let namespace = podManifest.metadata.namespace;
        if (!namespace || namespace === "All" || !namespace.trim()) {
            namespace = "default";
            podManifest.metadata.namespace = namespace;
        }

        const response = await k8sCoreApi.createNamespacedPod({
            namespace,
            body: podManifest,
        });

        return json(
            { message: "Pod created successfully", data: response.body },
            201,
        );
    } catch (error) {
        return json(
            { error: getErrorMessage(error, "Failed to create pod") },
            getErrorStatus(error),
        );
    }
}

async function listAllJobs() {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: true,
        });

        const items = (response.items || []).map((job) => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase:
                    job.status?.phase || job.spec?.minAvailable
                        ? "Running"
                        : "Unknown",
            },
        }));

        return json({ items, totalCount: items.length });
    } catch (error) {
        return json(
            { error: "Failed to fetch all jobs" },
            getErrorStatus(error),
        );
    }
}

async function listAllQueues() {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });
        return json({
            items: response.items,
            totalCount: response.items.length,
        });
    } catch (error) {
        return json(
            { error: "Failed to fetch all queues" },
            getErrorStatus(error),
        );
    }
}

async function listAllPods() {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.listPodForAllNamespaces();
        return json({
            items: response.items,
            totalCount: response.items.length,
        });
    } catch (error) {
        return json(
            { error: "Failed to fetch all pods" },
            getErrorStatus(error),
        );
    }
}

async function patchNamespacedQueue(request, namespace, name) {
    try {
        const { k8sApi } = getApis();
        const patchData = await request.json();
        const response = await k8sApi.patchNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "queues",
            name,
            body: patchData,
            options: {
                headers: { "Content-Type": "application/merge-patch+json" },
            },
        });
        return json({
            message: "Queue updated successfully",
            data: response.body,
        });
    } catch (error) {
        return json({ error: "Failed to update queue" }, getErrorStatus(error));
    }
}

export async function handleApiRequest(request, pathSegments) {
    const method = request.method.toUpperCase();
    const [resource, ...rest] = pathSegments;

    if (!resource) {
        return json({ error: "Not Found" }, 404);
    }

    if (resource === "jobs" && rest.length === 0) {
        if (method === "GET") return listJobs(request);
        if (method === "POST") return createJob(request);
    }
    if (resource === "jobs" && rest.length === 2) {
        const [namespace, name] = rest;
        if (method === "GET") return getJob(namespace, name);
        if (method === "PATCH") return patchJob(request, namespace, name);
        if (method === "DELETE") return deleteJob(namespace, name);
    }
    if (resource === "job" && rest.length === 3 && rest[2] === "yaml") {
        return getJobYaml(rest[0], rest[1]);
    }

    if (resource === "podgroups" && rest.length === 0 && method === "GET") {
        return listPodGroups(request);
    }
    if (resource === "podgroups" && rest.length === 2 && method === "GET") {
        return getPodGroup(rest[0], rest[1]);
    }
    if (
        resource === "podgroups" &&
        rest.length === 3 &&
        rest[2] === "yaml" &&
        method === "GET"
    ) {
        return getPodGroupYaml(rest[0], rest[1]);
    }

    if (resource === "queues" && rest.length === 0) {
        if (method === "GET") return listQueues(request);
        if (method === "POST") return createQueue(request);
    }
    if (resource === "queues" && rest.length === 1) {
        if (method === "GET") return getQueue(rest[0]);
        if (method === "PUT") return updateQueue(request, rest[0]);
        if (method === "DELETE") return deleteQueue(rest[0]);
    }
    if (resource === "queues" && rest.length === 2 && method === "PATCH") {
        return patchNamespacedQueue(request, rest[0], rest[1]);
    }
    if (resource === "queue" && rest.length === 2 && rest[1] === "yaml") {
        return getQueueYaml(rest[0]);
    }

    if (resource === "namespaces" && method === "GET") {
        return listNamespaces();
    }

    if (resource === "pods" && rest.length === 0) {
        if (method === "GET") return listPods(request);
        if (method === "POST") return createPod(request);
    }
    if (resource === "pod" && rest.length === 3 && rest[2] === "yaml") {
        return getPodYaml(rest[0], rest[1]);
    }

    if (resource === "all-jobs" && method === "GET") return listAllJobs();
    if (resource === "all-queues" && method === "GET") return listAllQueues();
    if (resource === "all-pods" && method === "GET") return listAllPods();

    return json({ error: "Not Found" }, 404);
}
