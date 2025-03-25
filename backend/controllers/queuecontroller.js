import { k8sCoreApi, k8sApi } from '../services/k8sClient.js';

// Fetch all Queues
export const getAllQueues = async (req, res) => {
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
        
        // Apply search filter
        if (searchTerm) {
            filteredQueues = filteredQueues.filter((queue) =>
                queue.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply state filter
        if (stateFilter && stateFilter !== "All") {
            filteredQueues = filteredQueues.filter((queue) =>
                queue.status.state === stateFilter
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
};


// Get details of a specific Queue
export const getQueueDetails = async (req, res) => {
    const queueName = req.params.name;
    try {
        console.log("Fetching details for queue:", queueName);
        
        const response = await k8sApi.getClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues",
            queueName
        );
        
        console.log("Queue details response:", response.body);

        res.json(response.body);
    } catch (error) {
        console.error("Error fetching queue details:", error);
        res.status(500).json({
            error: "Failed to fetch queue details",
            details: error.message,
        });
    }
};


// Get YAML of a specific Queue
export const getQueueYaml = async (req, res) => {
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
        console.error("Error fetching queue YAML:", error);
        res.status(500).json({
            error: "Failed to fetch queue YAML",
            details: error.message
        });
    }
};


