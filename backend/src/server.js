import express from "express";
import cors from "cors";
import {
    CoreV1Api,
    CustomObjectsApi,
    KubeConfig,
    Metrics,
    topPods,
    topNodes,
} from "@kubernetes/client-node";
import yaml from "js-yaml";

export const app = express();
app.use(express.json());

app.use(cors({ origin: "*" }));

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CustomObjectsApi);
const k8sCoreApi = kc.makeApiClient(CoreV1Api);

const metricsClient = new Metrics(kc);

const getPodMetrics = async () => {
    const pods = await topPods(k8sCoreApi, metricsClient, "default");
    return pods.map((pod) => {
        return {
            name: pod.Pod.metadata?.name,
            cpu: pod.CPU.CurrentUsage,
            memory: pod.Memory.CurrentUsage,
        };
    });
};

const getNodeMetrics = async () => {
    const nodes = await topNodes(k8sCoreApi);
    return nodes.map((node) => ({ cpu: node.CPU, memory: node.Memory }));
};

app.get("/api/metrics", async (req, res) => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const intervalId = setInterval(async () => {
            try {
                const nodeMetrics = await getNodeMetrics();
                const podMetrics = await getPodMetrics();
                res.write(
                    `data: ${JSON.stringify({ podMetrics, nodeMetrics }, (_, v) => (typeof v === "bigint" ? v.toString() : v))}\n\n`,
                );
            } catch (err) {
                throw new Error("Error fetching metrics");
            }
        }, 1000);

        req.on("close", () => {
            console.log("Client disconnected.");
            clearInterval(intervalId);
            res.end();
        });
    } catch (err) {
        console.log("Error fetching metrics:", err);
        res.status(500).send("Internal server error");
    }
});

app.get("/api/jobs", async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const queueFilter = req.query.queue || "";
        const statusFilter = req.query.status || "";

        console.log("Fetching jobs with params:", {
            namespace,
            searchTerm,
            queueFilter,
            statusFilter,
        });

        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                plural: "jobs",
                pretty: true,
            });
        } else {
            response = await k8sApi.listNamespacedCustomObject({
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

        // Apply queueFilter filtering
        if (queueFilter && queueFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.spec.queue === queueFilter,
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.status.state.phase === statusFilter,
            );
        }

        res.json({
            items: filteredJobs,
            totalCount: filteredJobs.length,
        });
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({
            error: "Failed to fetch jobs",
            details: err.message,
        });
    }
});

// Add an interface to obtain a single job
app.get("/api/jobs/:namespace/:name", async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
        res.json(response);
    } catch (err) {
        console.error("Error fetching job:", err);
        res.status(500).json({
            error: "Failed to fetch job",
            details: err.message,
        });
    }
});

// Add a route to obtain YAML in server.js
app.get("/api/job/:namespace/:name/yaml", async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });

        const formattedYaml = yaml.dump(response, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: error.message,
        });
    }
});

// Get details of a specific Queue
app.get("/api/queues/:name", async (req, res) => {
    const name = req.params.name;
    try {
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });
        res.json(response);
    } catch (error) {
        console.error("Error fetching queue details:", error);
        res.status(500).json({ error: "Failed to fetch queue details" });
    }
});

app.get("/api/queue/:name/yaml", async (req, res) => {
    const name = req.params.name;
    try {
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });

        const formattedYaml = yaml.dump(response, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        // Set the content type to text/yaml and send the response
        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: error.message,
        });
    }
});

app.put("/api/queues/:name", express.json(), async (req, res) => {
    const name = req.params.name;
    const updatedBody = req.body;

    try {
        console.log(
            `Attempting to update queue ${name} with:`,
            JSON.stringify(updatedBody),
        );

        // Validate the request body
        if (!updatedBody.spec || Object.keys(updatedBody.spec).length === 0) {
            return res.status(400).json({
                error: "Bad Request",
                details: "spec object is required and cannot be empty",
            });
        }

        // First, verify the queue exists
        try {
            await k8sApi.getClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                name: name,
            });
            console.log(`Found existing queue ${name}`);
        } catch (err) {
            console.error(`Queue ${name} not found:`, err);
            return res.status(404).json({
                error: "Not Found",
                details: `Queue ${name} not found`,
            });
        }

        // Convert numeric fields in spec from string to integer if needed
        const numericFields = new Set(["weight"]); // Add more fields here if needed

        const patchOperations = [];

        Object.entries(updatedBody.spec).forEach(([key, value]) => {
            let val = value;

            if (numericFields.has(key) && typeof val === "string") {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed)) {
                    val = parsed;
                }
            }

            patchOperations.push({
                op: "replace",
                path: `/spec/${key}`,
                value: val,
            });
        });

        console.log(
            "Using JSON Patch operations:",
            JSON.stringify(patchOperations),
        );

        // Apply the patch and capture the response
        const response = await k8sApi.patchClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: name,
            body: patchOperations,
            options: {
                headers: {
                    "Content-Type": "application/json-patch+json",
                },
            },
        });

        console.log("Patch response:", JSON.stringify(response.body, null, 2));

        // Get and return the fully updated queue
        const updatedQueue = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: name,
        });

        res.json({
            message: `Successfully updated queue ${name}`,
            patchResponse: response.body,
            updatedQueue: updatedQueue.body,
        });
    } catch (err) {
        console.error(`Error updating queue ${name}:`, err);
        res.status(500).json({
            error: `Failed to update queue ${name}`,
            details: err.body?.message || err.message,
            rawError: err.toString(),
        });
    }
});
// Get all Volcano Queues
app.get("/api/queues", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || "";
        const stateFilter = req.query.state || "";

        console.log("Fetching queues with params:", {
            page,
            limit,
            searchTerm,
            stateFilter,
        });

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
                (pod) => pod.status.state === stateFilter,
            );
        }

        const totalCount = filteredQueues.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalCount);
        const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

        res.json({
            items: paginatedQueues,
            totalCount: totalCount,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error("Error fetching queues:", error);
        res.status(500).json({
            error: "Failed to fetch queues",
            details: error.message,
        });
    }
});

// get all ns
app.get("/api/namespaces", async (req, res) => {
    try {
        const response = await k8sCoreApi.listNamespace();

        res.json({
            items: response.items,
        });
    } catch (error) {
        console.error("Error fetching namespaces:", error);
        res.status(500).json({
            error: "Failed to fetch namespaces",
            details: error.message,
        });
    }
});

app.get("/api/pods", async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const statusFilter = req.query.status || "";

        console.log("Fetching pods with params:", {
            namespace,
            searchTerm,
            statusFilter,
        });

        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sCoreApi.listPodForAllNamespaces();
        } else {
            response = await k8sCoreApi.listNamespacedPod({ namespace });
        }

        let filteredPods = response.items || [];

        // Improved search filter to search in both name and namespace
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

        // Status filter
        if (statusFilter && statusFilter !== "All") {
            filteredPods = filteredPods.filter(
                (pod) => pod.status.phase === statusFilter,
            );
        }

        // Sort pods by creation timestamp (newest first)
        filteredPods.sort((a, b) => {
            return (
                new Date(b.metadata.creationTimestamp) -
                new Date(a.metadata.creationTimestamp)
            );
        });

        res.json({
            items: filteredPods,
            totalCount: filteredPods.length,
        });
    } catch (err) {
        console.error("Error fetching pods:", err);
        res.status(500).json({
            error: "Failed to fetch pods",
            details: err.message,
        });
    }
});

// Get details of a specific Pod
app.get("/api/pod/:namespace/:name/yaml", async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });

        // Convert JSON to formatted YAML
        const formattedYaml = yaml.dump(response, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        //Set the content type to text/yaml and send the response
        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: error.message,
        });
    }
});

// Get all Jobs (no pagination)
app.get("/api/all-jobs", async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs", // 修改这里：从 "jobs" 改为 "vcjobs"
            pretty: true,
        });

        const jobs = response.items.map((job) => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase:
                    job.status?.phase || job.spec?.minAvailable
                        ? "Running"
                        : "Unknown",
            },
        }));

        res.json({
            items: jobs,
            totalCount: jobs.length,
        });
    } catch (err) {
        console.error("Error fetching all jobs:", err);
        res.status(500).json({ error: "Failed to fetch all jobs" });
    }
});

// Auxiliary function: determine the status based on the job status
function getJobState(job) {
    if (job.status?.state) return job.status.state;
    if (job.status === "Running") return "Running";
    if (job.status === "Completed") return "Completed";
    if (job.status === "Failed") return "Failed";
    if (job.status === "Pending") return "Running";
    return job.status || "Unknown";
}

// Get all Queues (no pagination)
app.get("/api/all-queues", async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });
        res.json({
            items: response.items,
            totalCount: response.items.length,
        });
    } catch (error) {
        console.error("Error fetching all queues:", error);
        res.status(500).json({ error: "Failed to fetch all queues" });
    }
});
app.patch("/api/jobs/:namespace/:name", async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const patchData = req.body;

        const options = {
            headers: { "Content-Type": "application/merge-patch+json" },
        };

        const response = await k8sApi.patchNamespacedCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            namespace,
            "jobs",
            name,
            patchData,
            undefined,
            undefined,
            undefined,
            options,
        );

        res.json({ message: "Job updated successfully", data: response.body });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ error: "Failed to update job" });
    }
});
app.patch("/api/queues/:namespace/:name", async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const patchData = req.body;

        const options = {
            headers: { "Content-Type": "application/merge-patch+json" },
        };

        const response = await k8sApi.patchNamespacedCustomObject(
            "scheduling.volcano.sh",
            "v1alpha1",
            namespace,
            "queues",
            name,
            patchData,
            undefined,
            undefined,
            undefined,
            options,
        );

        res.json({
            message: "Queue updated successfully",
            data: response.body,
        });
    } catch (error) {
        console.error("Error updating queue:", error);
        res.status(500).json({ error: "Failed to update queue" });
    }
});

// Get all Pods (no pagination)
app.get("/api/all-pods", async (req, res) => {
    try {
        const response = await k8sCoreApi.listPodForAllNamespaces();
        res.json({
            items: response.items,
            totalCount: response.items.length,
        });
    } catch (error) {
        console.error("Error fetching all pods:", error);
        res.status(500).json({ error: "Failed to fetch all pods" });
    }
});

// POST /api/pods - Create a pod
app.post("/api/pods", async (req, res) => {
    let podManifest = req.body;
    console.log("Received pod manifest:", JSON.stringify(podManifest, null, 2));

    try {
        // Defensive: check manifest shape
        if (
            !podManifest ||
            !podManifest.metadata ||
            !podManifest.metadata.name ||
            !podManifest.spec
        ) {
            return res.status(400).json({ error: "Invalid pod manifest" });
        }

        // Fix the apiVersion for regular Pods
        if (podManifest.apiVersion === "scheduling.volcano.sh/v1beta1") {
            podManifest.apiVersion = "v1";
        }

        // Fix the kind
        if (podManifest.kind !== "Pod") {
            podManifest.kind = "Pod";
        }

        // Validate that this is a proper Pod spec (not Queue spec)
        if (podManifest.spec.weight || podManifest.spec.reclaimable) {
            return res.status(400).json({
                error: "Invalid Pod spec. Use proper Pod specification with containers, not Queue fields.",
            });
        }

        // Ensure Pod spec has required containers field
        if (
            !podManifest.spec.containers ||
            !Array.isArray(podManifest.spec.containers)
        ) {
            return res.status(400).json({
                error: "Pod spec must include 'containers' array",
            });
        }

        // Defensive: never allow "All", fallback to "default" if missing
        let namespace = podManifest.metadata.namespace;
        if (
            !namespace ||
            namespace === "All" ||
            typeof namespace !== "string" ||
            !namespace.trim()
        ) {
            namespace = "default";
            podManifest.metadata.namespace = namespace;
        }

        console.log("Creating pod in namespace:", namespace);
        console.log(
            "Final pod manifest:",
            JSON.stringify(podManifest, null, 2),
        );

        // Use object-based syntax for consistency
        const response = await k8sCoreApi.createNamespacedPod({
            namespace: namespace,
            body: podManifest,
        });

        res.status(201).json({
            message: "Pod created successfully",
            data: response.body,
        });
    } catch (error) {
        console.error("Error creating pod:", error?.body || error);
        let msg = "Failed to create pod";
        if (error?.body?.message) {
            msg = error.body.message;
        } else if (error?.message) {
            msg = error.message;
        }
        res.status(500).json({ error: msg });
    }
});
// POST /api/jobs - Create a job (Volcano custom job)
app.post("/api/jobs", async (req, res) => {
    const jobManifest = req.body;
    try {
        if (
            !jobManifest ||
            !jobManifest.metadata ||
            !jobManifest.metadata.name ||
            !jobManifest.spec
        ) {
            return res.status(400).json({ error: "Invalid job manifest" });
        }

        const namespace = jobManifest.metadata.namespace || "default";

        const response = await k8sApi.createNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            body: jobManifest,
        });

        res.status(201).json({
            message: "Job created successfully",
            data: response.body,
        });
    } catch (error) {
        console.error("Error creating job:", error?.body || error);
        let msg = "Failed to create job";
        if (error?.body?.message) msg = error.body.message;
        res.status(500).json({ error: msg });
    }
});

//create a queue
app.post("/api/queues", async (req, res) => {
    const queueManifest = req.body;

    try {
        if (
            !queueManifest ||
            !queueManifest.metadata ||
            !queueManifest.metadata.name ||
            !queueManifest.spec
        ) {
            return res.status(400).json({ error: "Invalid queue manifest" });
        }

        const customAnnotations = queueManifest.annotations || {};
        queueManifest.metadata.annotations = {
            ...(queueManifest.metadata.annotations || {}),
            ...customAnnotations,
        };

        // Debug the API client
        console.log("API client type:", typeof k8sApi);
        console.log(
            "createClusterCustomObject method exists:",
            typeof k8sApi.createClusterCustomObject,
        );

        // Test if we can list queues first (simpler operation)
        console.log("Testing list operation first...");
        try {
            const listResponse = await k8sApi.listClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
            });
            console.log(
                "List operation successful, found",
                listResponse.items?.length || 0,
                "queues",
            );
        } catch (listError) {
            console.error("List operation failed:", listError.message);
        }

        // Add timeout and more detailed logging
        console.log("About to call k8sApi.createClusterCustomObject...");

        const response = await Promise.race([
            k8sApi.createClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                body: queueManifest,
            }),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("API call timeout after 30s")),
                    30000,
                ),
            ),
        ]);

        console.log("API call successful, response:", response);

        res.status(201).json({
            message: "Queue created successfully",
            data: response.body,
        });
    } catch (error) {
        console.error("Error creating queue:", error?.body || error);
        let msg = "Failed to create queue";
        if (error?.body?.message) msg = error.body.message;
        res.status(500).json({ error: msg });
    }
});
// Delete a Volcano Job
app.delete("/api/jobs/:namespace/:name", async (req, res) => {
    const { namespace, name } = req.params;
    try {
        // Try to delete the job directly (Kubernetes will 404 if not found)
        const response = await k8sApi.deleteNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
            body: { propagationPolicy: "Foreground" },
        });

        return res.json({
            message: "Job deleted successfully",
            data: response.body,
        });
    } catch (err) {
        // If Kubernetes provides a status code, use it
        const statusCode = err?.statusCode || err?.response?.statusCode || 500;
        let details = "Unknown error";
        let k8sBody = err?.body || err?.response?.body;

        // Try to parse the Kubernetes error body as JSON for best info
        try {
            if (typeof k8sBody === "string") {
                k8sBody = JSON.parse(k8sBody);
            }
            if (k8sBody?.message) {
                details = k8sBody.message;
            } else if (k8sBody?.details) {
                details = k8sBody.details;
            }
        } catch {
            // If parsing fails, just use the raw body string
            details = typeof k8sBody === "string" ? k8sBody : details;
        }

        // Log full error object for debugging
        console.error("Full Kubernetes Error Object:", err);

        // Respond with as much info from Kubernetes as possible
        return res.status(statusCode).json({
            error: k8sBody?.reason || "KubernetesError",
            message: details,
            code: statusCode,
            k8s: k8sBody,
        });
    }
});
app.delete("/api/queues/:name", async (req, res) => {
    const { name } = req.params;
    const queueName = name.toLowerCase();

    try {
        await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: queueName,
        });

        const { body } = await k8sApi.deleteClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: queueName,
            body: { propagationPolicy: "Foreground" },
        });

        return res.json({ message: "Queue deleted successfully", data: body });
    } catch (err) {
        const statusCode = err?.statusCode || err?.response?.statusCode || 500;

        let message = "An unexpected error occurred.";

        try {
            const rawBody = err?.body || err?.response?.body;

            // 🔹 Print the raw error body from Kubernetes
            console.error("Kubernetes Error Raw Body:", rawBody);

            const parsedBody =
                typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

            // 🔹 Print the parsed error body
            console.error("Kubernetes Error Parsed Body:", parsedBody);

            if (parsedBody?.message) {
                message = parsedBody.message;
            }
        } catch (parseErr) {
            console.error("Error parsing Kubernetes error body:", parseErr);
            message = err?.message || message;
        }

        // 🔹 Also print the full error object for debugging
        console.error("Full Kubernetes Error Object:", err);

        return res.status(statusCode).json({
            error: "Kubernetes Error",
            details: message,
        });
    }
});

const verifyVolcanoSetup = async () => {
    try {
        // Verify CRD access
        await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
        });
        return true;
    } catch (error) {
        console.error("Volcano verification failed:", error);
        return false;
    }
};

// Update your server startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    const volcanoReady = await verifyVolcanoSetup();
    if (volcanoReady) {
        console.log(`Server running on port ${PORT} with Volcano support`);
    } else {
        console.error("Server started but Volcano support is not available");
    }
});
