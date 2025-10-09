import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { k8sApi } from "../../utils/k8s";
import { fetchQueues } from "../helpers";
import {
    createQueueInputSchema,
    deleteQueueInputSchema,
    getQueueInputSchema,
    getQueuesInputSchema,
    updateQueueInputSchema
} from "./schema";

export const queueRouter = router({
    getQueue: procedure.input(getQueueInputSchema).query(async ({ input }) => {
        const { name } = input;
        const response = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name,
        });
        return response;
    }),
    getQueueYaml: procedure
        .input(getQueueInputSchema)
        .query(async ({ input }) => {
            const { name } = input;
            const response = await k8sApi.getClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                name,
            });

            const formattedYaml = yaml.dump(response, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false,
            });

            return formattedYaml;
        }),
    getQueues: procedure
        .input(getQueuesInputSchema)
        .query(async ({ input }) => {
            const { page = 1, pageSize = 10 } = input;
            console.log("Fetching queues with params:", {
                page,
                pageSize,
            });

            const filteredQueues = await fetchQueues(
                page,
                pageSize,
            );

            return filteredQueues;
        }),
    getAllQueues: procedure.query(async () => {
        const response = await k8sApi.listClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
        });
        return {
            items: response.items,
            totalCount: response.items.length,
        };
    }),
    createQueue: procedure.input(createQueueInputSchema).mutation(async ({ input }) => {
        const { queueManifest } = input;

        if (!queueManifest.metadata.name || !queueManifest.spec) {
            throw new Error("Invalid queue manifest: name and spec are required");
        }

        const response = await k8sApi.createClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            body: queueManifest,
        });

        return {
            message: "Queue created successfully",
            data: response.body,
        };
    }),
    updateQueue: procedure.input(updateQueueInputSchema).mutation(async ({ input }) => {
        const { name, updatedBody } = input;

        if (!updatedBody.spec || Object.keys(updatedBody.spec).length === 0) {
            throw new Error("spec object is required and cannot be empty");
        }

        try {
            await k8sApi.getClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "queues",
                name: name,
            });
        } catch {
            throw new Error(`Queue ${name} not found`);
        }

        const numericFields = new Set(["weight"]);
        const patchOperations: Array<{
            op: string;
            path: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: any;
        }> = [];

        Object.entries(updatedBody.spec).forEach(([key, value]) => {
            let val = value;

            if (numericFields.has(key) && typeof val === "string") {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed)) {
                    val = parsed;
                }
            }

            patchOperations.push({
                op: "replace",
                path: `/spec/${key}`,
                value: val,
            });
        });

        const response = await k8sApi.patchClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: name,
            body: patchOperations,
        });

        const updatedQueue = await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: name,
        });

        return {
            message: `Successfully updated queue ${name}`,
            patchResponse: response.body,
            updatedQueue: updatedQueue.body,
        };
    }),
    deleteQueue: procedure.input(deleteQueueInputSchema).mutation(async ({ input }) => {
        const { name } = input;
        const queueName = name.toLowerCase();

        await k8sApi.getClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: queueName,
        });

        const response = await k8sApi.deleteClusterCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            plural: "queues",
            name: queueName,
            body: { propagationPolicy: "Foreground" },
        });

        return {
            message: "Queue deleted successfully",
            data: response.body,
        };
    }),
});
