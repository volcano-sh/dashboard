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

// Update a queue by name
export const updateQueue = async (req, res) => {
    const name = req.params.name;
    
    try {
        // Debug logging to check what's coming in
        console.log(`updateQueue called for queue ${name}`);
        console.log(`Request body type: ${typeof req.body}`);
        console.log(`Request body: ${JSON.stringify(req.body, null, 2)}`);
        
        const queueData = req.body;
        
        // Thorough validation
        if (!queueData || Object.keys(queueData).length === 0) {
            console.error("Empty request body received");
            return res.status(400).json({
                error: "Invalid queue data. Request body is empty."
            });
        }
        
        if (!queueData.metadata) {
            return res.status(400).json({
                error: "Invalid queue data. Missing 'metadata' field."
            });
        }
        
        if (!queueData.metadata.name) {
            return res.status(400).json({
                error: "Invalid queue data. Missing 'metadata.name' field."
            });
        }
        
        if (!queueData.spec) {
            return res.status(400).json({
                error: "Invalid queue data. Missing 'spec' field."
            });
        }
        
        // Ensure the name in the URL matches the name in the body
        if (queueData.metadata.name !== name) {
            return res.status(400).json({
                error: `Queue name in URL (${name}) does not match the name in the request body (${queueData.metadata.name}).`
            });
        }
        
        // Remove status field if present - K8s API doesn't allow client to update status
        if (queueData.status) {
            console.log("Removing status field from queue data before update");
            delete queueData.status;
        }
        
        try {
            // Fetch current queue to get the resourceVersion (needed for updates)
            const currentQueueResponse = await k8sApi.getClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                name: name,
            });
            
            
            // The response object might have a body property or might be the data directly
            const currentQueue = currentQueueResponse.body || currentQueueResponse;
            
            // Ensure we use the current resourceVersion to avoid conflicts
            queueData.metadata.resourceVersion = currentQueue.metadata.resourceVersion;
            
            console.log("Making API call to update queue with resourceVersion:", queueData.metadata.resourceVersion);
            
            // Make the update request to the Kubernetes API
            const response = await k8sApi.replaceClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                name: name,
                body: queueData,
            });
            
            console.log(`Successfully updated queue ${name}`);
            
            // Return the updated resource - handle both response formats
            const responseData = response.body || response;
            
            res.status(200).json({
                message: `Queue ${name} updated successfully`,
                queue: responseData
            });
        } catch (error) {
            console.error(`Error getting or updating queue ${name}:`, error);
            throw error; 
        }
    } catch (error) {
        console.error(`Error updating queue ${name}:`, error);
        
        
        const statusCode = error.statusCode || 500;
        const errorMessage = error.body?.message || error.message || "Unknown error";
        
        res.status(statusCode).json({
            error: `Failed to update queue: ${errorMessage}`,
            details: error.body || error.stack
        });
    }
};