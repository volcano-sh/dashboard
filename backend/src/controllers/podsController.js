import { k8sCoreApi } from "../config/kubernetesClient.js";
import { formatToYaml } from "../utils/yamlFormatter.js";

// Get pods with filtering
export const getPods = async (req, res) => {
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

        // Apply search filter
        if (searchTerm) {
            filteredPods = filteredPods.filter((pod) =>
                pod.metadata.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredPods = filteredPods.filter(
                (pod) => pod.status.phase === statusFilter,
            );
        }

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
};

// Get YAML representation of a pod
export const getPodYaml = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });

        const yamlContent = formatToYaml(response);
        
        res.setHeader("Content-Type", "text/yaml");
        res.send(yamlContent);
    } catch (error) {
        console.error("Error fetching pod YAML:", error);
        res.status(500).json({
            error: "Failed to fetch pod YAML",
            details: error.message,
        });
    }
};

// Get all pods without pagination
export const getAllPods = async (req, res) => {
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
};