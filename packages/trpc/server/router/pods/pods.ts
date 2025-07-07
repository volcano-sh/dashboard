import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { k8sCoreApi } from "../../utils/k8s";
import { fetchPods } from "../helpers";
import { createPodInputSchema, getPodsInputSchema, getPodYamlInputSchema } from "./schema";

export const podRouter = router({
    getPods: procedure.input(getPodsInputSchema).query(async ({ input }) => {
        const {
            page = 1,
            pageSize = 10,
        } = input;
        console.log("Fetching pods with params:", {
            page,
            pageSize,
        });

        const result = await fetchPods(
            page,
            pageSize,
        );

        return result;
    }),
    getPodYaml: procedure
        .input(getPodYamlInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            const response = await k8sCoreApi.readNamespacedPod({
                name,
                namespace,
            });

            const formattedYaml = yaml.dump(response, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false,
            });

            return formattedYaml;
        }),
    getAllPods: procedure.query(async () => {
        const response = await k8sCoreApi.listNamespacedPod({
            namespace: "default",
        });
        return {
            items: response.items,
            totalCount: response.items.length,
        };
    }),
    createPod: procedure.input(createPodInputSchema).mutation(async ({ input }) => {
        const { podManifest } = input;

        const response = await k8sCoreApi.createNamespacedPod({
            namespace: podManifest.metadata.namespace || "default",
            body: podManifest,
        });

        return {
            message: "Pod created successfully",
            data: response,
        };
    }),
});
