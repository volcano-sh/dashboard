import { Request, Response } from "express";
import { k8sCoreApi } from "../config/kubernetes.js";
import yaml from "js-yaml";

// Get all Pods (no pagination)
export const getAllPods = async (req: Request, res: Response) => {
    try {
        const response = await k8sCoreApi.listPodForAllNamespaces();
        res.json({
            items: response.body.items,
            totalCount: response.body.items.length
        });
    } catch (error) {
        console.error("Error fetching all pods:", error);
        res.status(500).json({ error: "Failed to fetch all pods" });
    }
};

interface PodQueryParams {
    namespace?: string;
    search?: string;
    status?: string;
}
export const getPods = async (
    req: Request<{}, {}, {}, PodQueryParams>,
    res: Response
) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const statusFilter = req.query.status || "";

        console.log("Fetching pods with params:", {
            namespace,
            searchTerm,
            statusFilter
        });

        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sCoreApi.listPodForAllNamespaces();
        } else {
            response = await k8sCoreApi.listNamespacedPod(namespace);
        }

        let filteredPods = response.body.items || [];

        // Apply search filter
        if (searchTerm) {
            filteredPods = filteredPods.filter((pod) =>
                pod.metadata?.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredPods = filteredPods.filter(
                (pod) => pod.status?.phase === statusFilter
            );
        }

        res.json({
            items: filteredPods,
            totalCount: filteredPods.length
        });
    } catch (err) {
        console.error("Error fetching pods:", err);
        res.status(500).json({
            error: "Failed to fetch pods",
            details: (err as Error).message
        });
    }
};

// Get details of a specific Pod
export const getPodYamlByName = async (req: Request, res: Response) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sCoreApi.readNamespacedPod(name, namespace);

        // Convert JSON to formatted YAML
        const formattedYaml = yaml.dump(response.body, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        //Set the content type to text/yaml and send the response
        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: (error as Error).message
        });
    }
};
