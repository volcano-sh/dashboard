import { k8sCoreApi } from "../config/kubernetes.js";

// get all ns
export const getNamespaces = async (req, res) => {
    try {
        const response = await k8sCoreApi.listNamespace()

        res.json({
            items: response.body.items
        });
    } catch (error) {
        console.error("Error fetching namespaces:", error);
        res.status(500).json({
            error: "Failed to fetch namespaces",
            details: error.message,
        });
    }
}