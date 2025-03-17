import yaml from "js-yaml"; 
import { k8sApi } from "../../../utils/k8s";
import { procedure, router } from "../../trpc"
import { fetchQueues } from "../helpers";
import { getQueueInputSchema, getQueuesInputSchema } from "./schema";

export const queueRouter = router({
    getQueue: procedure
        .input(getQueueInputSchema) 
        .query(async ({ input }) => {
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

            const formattedYaml = yaml.dump(response.body, {
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
            const { page = 1, limit = 10, searchTerm = "", stateFilter = "" } = input;
            console.log("Fetching queues with params:", {
                page,
                limit,
                searchTerm,
                stateFilter,
            });

            const filteredQueues = await fetchQueues(searchTerm, stateFilter);

            const totalCount = filteredQueues.length;
            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + limit, totalCount);
            const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

            return {
                items: paginatedQueues,
                totalCount: totalCount,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalCount / limit),
            };
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
});