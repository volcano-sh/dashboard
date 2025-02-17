import { Request, Response } from "express";
import { k8sApi } from "../config/kubernetes.js";
import yaml from "js-yaml";
import http from "http";
import { IQueue } from "../types/index.js";

interface IResponse {
    response: http.IncomingMessage;
    body: { items: IQueue[] };
}
// @desc   Get all Queues (no pagination)
// @route  GET /api/all-queues
export const getAllQueues = async (req: Request, res: Response) => {
    try {
        const response = (await k8sApi.listClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues"
        )) as IResponse;
        res.json({
            items: response.body.items,
            totalCount: response.body.items.length
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
// @desc   Get all queues with pagination and filters
// @route  GET /api/queues
export const getQueues = async (
    req: Request<{}, {}, {}, QueueQueryParams>,
    res: Response
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
            stateFilter
        });

        const response = (await k8sApi.listClusterCustomObject(
            "scheduling.volcano.sh",
            "v1beta1",
            "queues"
        )) as IResponse;

        let filteredQueues = response.body.items || [];

        if (searchTerm) {
            filteredQueues = filteredQueues.filter((queue) =>
                queue.metadata?.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }

        if (stateFilter && stateFilter !== "All") {
            filteredQueues = filteredQueues.filter(
                (pod) => pod.status?.state === stateFilter
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
            details: (error as Error).message
        });
    }
};

// @desc   Get details of a specific Queue
// @route  GET /api/queues/:name

export const getQueueByName = async (req: Request, res: Response) => {
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
};

// @desc   Get YAML of a specific Queue
// @route  GET /api/queues/:name/yaml
export const getQueueYamlByName = async (req: Request, res: Response) => {
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
