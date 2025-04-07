import { Request, Response } from "express";
import { k8sApi } from "../config/kubernetes";
import yaml from "js-yaml";
import http from "http";
import { IQueue } from "../types/index";

interface IResponse {
    items: IQueue[];
}
// @desc Get all Queues (no pagination)
// @route GET /all-queues
export const getAllQueues = async (req: Request, res: Response) => {
    try {
        const response: IResponse = await k8sApi.listClusterCustomObject({
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
interface QueueQueryParams {
    page?: string;
    limit?: string;
    search?: string;
    state?: string;
}

// @desc Get all queues with optional filters
// @route GET /queues
export const getQueues = async (
    req: Request<{}, {}, {}, QueueQueryParams>,
    res: Response,
) => {
    try {
        const page = parseInt(req.query.page || "1");
        const limit = parseInt(req.query.limit || "10");
        const searchTerm = req.query.search || "";
        const stateFilter = req.query.state || "";

        console.log("Fetching queues with params:", {
            page,
            limit,
            searchTerm,
            stateFilter,
        });

        const response: IResponse = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });

        let filteredQueues = response.items || [];

        if (searchTerm) {
            filteredQueues = filteredQueues.filter((queue) =>
                queue.metadata?.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        if (stateFilter && stateFilter !== "All") {
            filteredQueues = filteredQueues.filter(
                (pod) => pod.status?.state === stateFilter,
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
            details: (error as Error).message,
        });
    }
};

// @desc Get queue details by name
// @route GET /queues/:name
export const getQueueByName = async (req: Request, res: Response) => {
    const { name } = req.params;
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

// @desc Get queue YAML by name
// @route GET /queues/:name/yaml
export const getQueueYamlByName = async (req: Request, res: Response) => {
    const { name } = req.params;
    try {
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });

        const formattedYaml = yaml.dump(response.body, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        // Set the content type to text/yaml and send the response
        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: (error as Error).message,
        });
    }
};
