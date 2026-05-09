import k8sService from "../services/k8sService.js";

export const getNamespaces = async (req, res) => {
    try {
        const result = await k8sService.listNamespaces(req.clusterContext);
        res.json(result);
    } catch (error) {
        console.error("Error fetching namespaces:", error);
        res.status(500).json({
            error: "Failed to fetch namespaces",
            details: error.message,
        });
    }
};
