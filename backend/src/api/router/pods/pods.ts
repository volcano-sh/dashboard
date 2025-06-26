import yaml from "js-yaml";
import { k8sCoreApi } from "../../../utils/k8s";
import { procedure, router } from "../../trpc";
import { fetchPods } from "../helpers";
import { createPodInputSchema, getPodsInputSchema, getPodYamlInputSchema } from "./schema";

export const podRouter = router({
    getPods: procedure.input(getPodsInputSchema).query(async ({ input }) => {
        const {
            namespace = "",
            search = "",
            status = "",
            page = 1,
            pageSize = 10,
        } = input;
        console.log("Fetching pods with params:", {
            namespace,
            search,
            status,
            page,
            pageSize,
        });

        const result = await fetchPods(
            namespace,
            search,
            status,
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

        if (!podManifest.metadata.name || !podManifest.spec) {
            throw new Error("Invalid pod manifest: name and spec are required");
        }

        // Fix the apiVersion for regular Pods
        if (podManifest.apiVersion === "scheduling.volcano.sh/v1beta1") {
            podManifest.apiVersion = "v1";
        }

        // Fix the kind
        if (podManifest.kind !== "Pod") {
            podManifest.kind = "Pod";
        }

        const spec = podManifest.spec as any;
        if (spec.weight || spec.reclaimable) {
            throw new Error("Invalid Pod spec. Use proper Pod specification with containers, not Queue fields.");
        }

        if (!podManifest.spec.containers || !Array.isArray(podManifest.spec.containers)) {
            throw new Error("Pod spec must include 'containers' array");
        }

        let namespace = podManifest.metadata.namespace;
        if (!namespace || namespace === "All" || typeof namespace !== "string" || !namespace.trim()) {
            namespace = "default";
            podManifest.metadata.namespace = namespace;
        }

        const response = await k8sCoreApi.createNamespacedPod({
            namespace: namespace,
            body: podManifest,
        });

        return {
            message: "Pod created successfully",
            data: response,
        };
    }),
});
