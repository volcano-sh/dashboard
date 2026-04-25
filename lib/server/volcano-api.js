import { getKubernetesClients, yamlResponse } from "./kubernetes";
import {
    apiError,
    filterBySearch,
    json,
    labelEntries,
    paginate,
    queryValue,
    sortItems,
    text,
    toInt,
} from "./api-utils";
import {
    jobPhase,
    withJobSummary,
    withNamespaceSummary,
    withPodGroupSummary,
    withPodSummary,
    withQueueSummary,
} from "./summary-mappers";
import { schedulerConfigJson, schedulerConfigYaml } from "./scheduler-config";

const getApis = () => {
    const { k8sApi, k8sCoreApi } = getKubernetesClients();
    return { k8sApi, k8sCoreApi };
};

const queryOptions = (request) => {
    const { searchParams } = new URL(request.url);
    const page = searchParams.has("page")
        ? toInt(queryValue(searchParams, "page"), 1)
        : null;
    const limit = searchParams.has("limit")
        ? toInt(queryValue(searchParams, "limit"), 10)
        : null;
    return {
        searchParams,
        page,
        limit,
        searchTerm: queryValue(searchParams, "search"),
        sortBy: queryValue(searchParams, "sortBy"),
        sortOrder: queryValue(searchParams, "sortOrder", "asc"),
    };
};

const listResponse = (items, options) => {
    const sorted = sortItems(items, options.sortBy, options.sortOrder);
    return json(paginate(sorted, options.page, options.limit));
};

export async function listJobs(request) {
    try {
        const { k8sApi } = getApis();
        const options = queryOptions(request);
        const { searchParams, searchTerm } = options;
        const namespace = queryValue(searchParams, "namespace");
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
        items = filterBySearch(items, searchTerm, (job) => [
            job.metadata?.name,
            job.metadata?.namespace,
            job.spec?.queue,
            ...labelEntries(job.metadata?.labels),
        ]);

        if (queueFilter && queueFilter !== "All") {
            items = items.filter((job) => job.spec?.queue === queueFilter);
        }
        if (statusFilter && statusFilter !== "All") {
            items = items.filter((job) => jobPhase(job) === statusFilter);
        }
        return listResponse(items.map(withJobSummary), options);
    } catch (error) {
        return apiError(error, "Failed to fetch jobs");
    }
}

export async function getJob(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
        return json(withJobSummary(response));
    } catch (error) {
        return apiError(error, "Failed to fetch job");
    }
}

export async function getJobYaml(namespace, name) {
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
        return apiError(error, "Failed to fetch job YAML");
    }
}

export async function createJob(request) {
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
        return apiError(error, "Failed to create job");
    }
}

export async function patchJob(request, namespace, name) {
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
        return apiError(error, "Failed to update job");
    }
}

export async function deleteJob(namespace, name) {
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
        return apiError(error, "Failed to delete job");
    }
}

export async function listPodGroups(request) {
    try {
        const { k8sApi } = getApis();
        const options = queryOptions(request);
        const { searchParams, searchTerm } = options;
        const namespace = queryValue(searchParams, "namespace");
        const queueFilter = queryValue(searchParams, "queue");
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
        items = filterBySearch(items, searchTerm, (podGroup) => [
            podGroup.metadata?.name,
            podGroup.metadata?.namespace,
            podGroup.spec?.queue,
            ...labelEntries(podGroup.metadata?.labels),
        ]);

        if (statusFilter && statusFilter !== "All") {
            items = items.filter((pg) => pg.status?.phase === statusFilter);
        }
        if (queueFilter && queueFilter !== "All") {
            items = items.filter((pg) => pg.spec?.queue === queueFilter);
        }
        return listResponse(items.map(withPodGroupSummary), options);
    } catch (error) {
        return apiError(error, "Failed to fetch podgroups");
    }
}

export async function getPodGroup(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            namespace,
            plural: "podgroups",
            name,
        });
        return json(withPodGroupSummary(response));
    } catch (error) {
        return apiError(error, "Failed to fetch podgroup");
    }
}

export async function getPodGroupYaml(namespace, name) {
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
        return apiError(error, "Failed to fetch podgroup YAML");
    }
}

export async function deletePodGroup(namespace, name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.deleteNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            namespace,
            plural: "podgroups",
            name,
            body: { propagationPolicy: "Foreground" },
        });

        return json({
            message: "PodGroup deleted successfully",
            data: response.body,
        });
    } catch (error) {
        return apiError(error, "Failed to delete podgroup");
    }
}

export async function listQueues(request) {
    try {
        const { k8sApi } = getApis();
        const options = queryOptions(request);
        const { searchParams, searchTerm } = options;
        const stateFilter =
            queryValue(searchParams, "state") ||
            queryValue(searchParams, "status");
        const queueFilter = queryValue(searchParams, "queue");
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });

        let items = response.items || [];
        items = filterBySearch(items, searchTerm, (queue) => [
            queue.metadata?.name,
            queue.spec?.parent,
            queue.status?.state,
            ...labelEntries(queue.metadata?.labels),
        ]);
        if (stateFilter && stateFilter !== "All") {
            items = items.filter(
                (queue) =>
                    queue.status?.state === stateFilter ||
                    (queue.status?.state === "Open" &&
                        stateFilter === "Active"),
            );
        }
        if (queueFilter && queueFilter !== "All") {
            items = items.filter(
                (queue) =>
                    queue.metadata?.name === queueFilter ||
                    queue.spec?.parent === queueFilter,
            );
        }
        return listResponse(items.map(withQueueSummary), options);
    } catch (error) {
        return apiError(error, "Failed to fetch queues");
    }
}

export async function getQueue(name) {
    try {
        const { k8sApi } = getApis();
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });
        return json(withQueueSummary(response));
    } catch (error) {
        return apiError(error, "Failed to fetch queue details");
    }
}

export async function getQueueYaml(name) {
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
        return apiError(error, "Failed to fetch queue YAML");
    }
}

export async function updateQueue(request, name) {
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
        return apiError(error, `Failed to update queue ${name}`);
    }
}

export async function createQueue(request) {
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
        return apiError(error, "Failed to create queue");
    }
}

export async function deleteQueue(name) {
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
        return apiError(error, "Failed to delete queue");
    }
}

export async function listNamespaces(request) {
    try {
        const { k8sCoreApi } = getApis();
        const options = queryOptions(request);
        const { searchTerm } = options;
        const response = await k8sCoreApi.listNamespace();
        const items = filterBySearch(
            response.items || [],
            searchTerm,
            (namespace) => [namespace.metadata?.name, namespace.status?.phase],
        );
        return listResponse(items.map(withNamespaceSummary), options);
    } catch (error) {
        return apiError(error, "Failed to fetch namespaces");
    }
}

export async function listPods(request) {
    try {
        const { k8sCoreApi } = getApis();
        const options = queryOptions(request);
        const { searchParams, searchTerm } = options;
        const namespace = queryValue(searchParams, "namespace");
        const queueFilter = queryValue(searchParams, "queue");
        const statusFilter = queryValue(searchParams, "status");
        const response =
            namespace === "" || namespace === "All"
                ? await k8sCoreApi.listPodForAllNamespaces()
                : await k8sCoreApi.listNamespacedPod({ namespace });

        let items = response.items || [];
        items = filterBySearch(items, searchTerm, (pod) => [
            pod.metadata?.name,
            pod.metadata?.namespace,
            pod.status?.phase,
            pod.spec?.nodeName,
            pod.metadata?.annotations?.["scheduling.volcano.sh/queue-name"],
            ...labelEntries(pod.metadata?.labels),
        ]);
        if (statusFilter && statusFilter !== "All") {
            items = items.filter((pod) => pod.status?.phase === statusFilter);
        }
        if (queueFilter && queueFilter !== "All") {
            items = items.filter(
                (pod) =>
                    pod.metadata?.annotations?.[
                        "scheduling.volcano.sh/queue-name"
                    ] === queueFilter ||
                    pod.metadata?.labels?.queue === queueFilter,
            );
        }
        return listResponse(items.map(withPodSummary), {
            ...options,
            sortBy: options.sortBy || "metadata.creationTimestamp",
            sortOrder: options.sortBy ? options.sortOrder : "desc",
        });
    } catch (error) {
        return apiError(error, "Failed to fetch pods");
    }
}

export async function getPod(namespace, name) {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });
        return json(withPodSummary(response));
    } catch (error) {
        return apiError(error, "Failed to fetch pod");
    }
}

export async function getPodYaml(namespace, name) {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });
        return text(yamlResponse(response));
    } catch (error) {
        return apiError(error, "Failed to fetch pod YAML");
    }
}

export async function getPodLogs(request, namespace, name) {
    try {
        const { k8sCoreApi } = getApis();
        const { searchParams } = new URL(request.url);
        const container = queryValue(searchParams, "container") || undefined;
        const previous = queryValue(searchParams, "previous") === "true";
        const tailLines = toInt(queryValue(searchParams, "tailLines"), 200);
        const response = await k8sCoreApi.readNamespacedPodLog({
            name,
            namespace,
            container,
            previous,
            tailLines,
            timestamps: true,
        });

        return text(
            typeof response === "string"
                ? response
                : response?.body || response?.data || "",
            200,
            "text/plain",
        );
    } catch (error) {
        return apiError(error, "Failed to fetch pod logs");
    }
}

export async function getPodEvents(namespace, name) {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.listNamespacedEvent(
            namespace,
            undefined,
            undefined,
            undefined,
            `involvedObject.kind=Pod,involvedObject.name=${name}`,
        );
        const items =
            response?.items ||
            response?.body?.items ||
            response?.data?.items ||
            [];

        const normalized = items
            .map((event) => ({
                count: event?.count ?? 1,
                firstTimestamp:
                    event?.firstTimestamp ||
                    event?.eventTime ||
                    event?.metadata?.creationTimestamp ||
                    "",
                lastTimestamp:
                    event?.lastTimestamp ||
                    event?.eventTime ||
                    event?.metadata?.creationTimestamp ||
                    "",
                message: event?.message || "-",
                reason: event?.reason || "-",
                type: event?.type || "Normal",
            }))
            .sort(
                (a, b) =>
                    new Date(b.lastTimestamp || 0) -
                    new Date(a.lastTimestamp || 0),
            );

        return json({
            items: normalized,
            totalCount: normalized.length,
        });
    } catch (error) {
        return apiError(error, "Failed to fetch pod events");
    }
}

export async function deletePod(namespace, name) {
    try {
        const { k8sCoreApi } = getApis();
        const response = await k8sCoreApi.deleteNamespacedPod({
            namespace,
            name,
            body: { propagationPolicy: "Foreground" },
        });

        return json({
            message: "Pod deleted successfully",
            data: response.body,
        });
    } catch (error) {
        return apiError(error, "Failed to delete pod");
    }
}

export async function createPod(request) {
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
        return apiError(error, "Failed to create pod");
    }
}

export async function patchNamespacedQueue(request, namespace, name) {
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
        return apiError(error, "Failed to update queue");
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
    if (resource === "jobs" && rest.length === 3 && rest[2] === "yaml") {
        return getJobYaml(rest[0], rest[1]);
    }
    if (resource === "podgroups" && rest.length === 0 && method === "GET") {
        return listPodGroups(request);
    }
    if (resource === "podgroups" && rest.length === 2) {
        if (method === "GET") return getPodGroup(rest[0], rest[1]);
        if (method === "DELETE") return deletePodGroup(rest[0], rest[1]);
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
        if (method === "PATCH") return updateQueue(request, rest[0]);
        if (method === "DELETE") return deleteQueue(rest[0]);
    }
    if (resource === "queues" && rest.length === 2 && rest[1] === "yaml") {
        return getQueueYaml(rest[0]);
    }
    if (resource === "queues" && rest.length === 2 && method === "PATCH") {
        return patchNamespacedQueue(request, rest[0], rest[1]);
    }
    if (resource === "namespaces" && method === "GET") {
        return listNamespaces(request);
    }

    if (resource === "pods" && rest.length === 0) {
        if (method === "GET") return listPods(request);
        if (method === "POST") return createPod(request);
    }
    if (resource === "pods" && rest.length === 2) {
        if (method === "GET") return getPod(rest[0], rest[1]);
        if (method === "DELETE") return deletePod(rest[0], rest[1]);
    }
    if (resource === "pods" && rest.length === 3 && rest[2] === "yaml") {
        return getPodYaml(rest[0], rest[1]);
    }
    if (resource === "scheduler" && rest[0] === "config") {
        const { k8sCoreApi } = getApis();
        if (rest.length === 1 && method === "GET") {
            return schedulerConfigJson(k8sCoreApi);
        }
        if (rest.length === 2 && rest[1] === "yaml" && method === "GET") {
            return schedulerConfigYaml(k8sCoreApi);
        }
    }

    return json({ error: "Not Found" }, 404);
}
