import { Request, Response } from "express";
import { k8sCoreApi } from "../config/kubernetes.js";

// get all ns
export const getNamespaces = async (req: Request, res: Response) => {
    try {
        const response = await k8sCoreApi.listNamespace()

        res.json({
            items: response.body.items
        });
    } catch (error) {
        console.error("Error fetching namespaces:", error);
        res.status(500).json({
            error: "Failed to fetch namespaces",
            details: (error as Error).message,
        });
    }
}