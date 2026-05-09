import k8sService from "../services/k8sService.js";
import yaml from "js-yaml";

export const getPodGroups = async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const statusFilter = req.query.status || "";

        const result = await k8sService.listPodGroups(
            req.clusterContext,
            namespace,
            searchTerm,
            statusFilter,
        );
        res.json(result);
    } catch (err) {
        console.error("Error fetching podgroups:", err);
        res.status(500).json({
            error: "Failed to fetch podgroups",
            details: err.message,
        });
    }
};

export const getPodGroupDetails = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const result = await k8sService.getPodGroup(req.clusterContext, namespace, name);
        res.json(result);
    } catch (err) {
        console.error("Error fetching podgroup:", err);
        res.status(500).json({
            error: "Failed to fetch podgroup",
            details: err.message,
        });
    }
};

export const getPodGroupYaml = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const result = await k8sService.getPodGroup(req.clusterContext, namespace, name);

        const formattedYaml = yaml.dump(result, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching podgroup YAML:", error);
        res.status(500).json({
            error: "Failed to fetch podgroup YAML",
            details: error.message,
        });
    }
};
