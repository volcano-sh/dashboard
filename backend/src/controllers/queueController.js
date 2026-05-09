import k8sService from "../services/k8sService.js";
import yaml from "js-yaml";

export const getQueues = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || "";
        const stateFilter = req.query.state || "";

        const result = await k8sService.listQueues(
            req.clusterContext,
            page,
            limit,
            searchTerm,
            stateFilter,
        );
        res.json(result);
    } catch (error) {
        console.error("Error fetching queues:", error);
        res.status(500).json({
            error: "Failed to fetch queues",
            details: error.message,
        });
    }
};

export const getQueueDetails = async (req, res) => {
    try {
        const { name } = req.params;
        const result = await k8sService.getQueue(req.clusterContext, name);
        res.json(result);
    } catch (error) {
        console.error("Error fetching queue details:", error);
        res.status(500).json({ error: "Failed to fetch queue details" });
    }
};

export const getQueueYaml = async (req, res) => {
    try {
        const { name } = req.params;
        const result = await k8sService.getQueue(req.clusterContext, name);

        const formattedYaml = yaml.dump(result, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching queue YAML:", error);
        res.status(500).json({
            error: "Failed to fetch queue YAML",
            details: error.message,
        });
    }
};

export const updateQueue = async (req, res) => {
    try {
        const { name } = req.params;
        const patchData = req.body;

        const result = await k8sService.patchQueue(req.clusterContext, name, patchData);
        res.json({
            message: "Queue updated successfully",
            data: result.body,
        });
    } catch (error) {
        console.error("Error updating queue:", error);
        res.status(500).json({ error: "Failed to update queue" });
    }
};
