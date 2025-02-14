import { k8sApi } from "../config/kubernetes.js";
import yaml from "js-yaml";

// Get all Queues (no pagination)
export const getAllQueues = async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues"
        );
        res.json({
            items: response.body.items,
            totalCount: response.body.items.length
        });
    } catch (error) {
        console.error("Error fetching all queues:", error);
        res.status(500).json({ error: "Failed to fetch all queues" });
    }
}

// Get all Volcano Queues
export const getQueues = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || "";
        const stateFilter = req.query.state || "";

        console.log('Fetching queues with params:', { page, limit, searchTerm, stateFilter });

        const response = await k8sApi.listClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues"
        );

        let filteredQueues = response.body.items || [];

        if (searchTerm) {
            filteredQueues = filteredQueues.filter((queue) =>
                queue.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (stateFilter && stateFilter !== "All") {
            filteredQueues = filteredQueues.filter((pod) =>
                pod.status.state === stateFilter
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
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.error("Error fetching queues:", error);
        res.status(500).json({
            error: "Failed to fetch queues",
            details: error.message,
        });
    }
}

// Get details of a specific Queue
export const getQueueByName = async (req, res) => {
    try {
        const response = await k8sApi.getClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues",
            req.params.name
        );
        res.json(response.body);
    } catch (error) {
        console.error("Error fetching queue details:", error);
        res.status(500).json({ error: "Failed to fetch queue details" });
    }
}

export const getQueueYamlByName = async (req, res) => {
    try {

        const response = await k8sApi.getClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues",
            req.params.name
        );

        const formattedYaml = yaml.dump(response.body, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        // Set the content type to text/yaml and send the response
        res.setHeader('Content-Type', 'text/yaml');
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: error.message
        });
    }
}