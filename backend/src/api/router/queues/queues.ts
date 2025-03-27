import yaml from "js-yaml";
import { k8sApi } from "../../../utils/k8s";
import { procedure, router } from "../../trpc";
import { fetchQueues } from "../helpers";
import { getQueueInputSchema, getQueuesInputSchema } from "./schema";

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
            const { page = 1, pageSize = 10, search = "", state = "" } = input;
            console.log("Fetching queues with params:", {
                page,
                pageSize,
                search,
                state,
            });

            const filteredQueues = await fetchQueues(
                search,
                state,
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
});
