import { k8sApi } from "../config/kubernetesClient.js";
import { formatToYaml } from "../utils/yamlFormatter.js";

// Get queue details by name
export const getQueueByName = async (req, res) => {
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
};

// Get YAML representation of a queue
export const getQueueYaml = async (req, res) => {
    const name = req.params.name;
    try {
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });

        const yamlContent = formatToYaml(response);
        
        res.setHeader("Content-Type", "text/yaml");
        res.send(yamlContent);
    } catch (error) {
        console.error("Error fetching queue YAML:", error);
        res.status(500).json({
            error: "Failed to fetch queue YAML",
            details: error.message,
        });
    }
};

// Get all queues with filtering and pagination
export const getQueues = async (req, res) => {
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
};

// Get all queues without pagination
export const getAllQueues = async (req, res) => {
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
};