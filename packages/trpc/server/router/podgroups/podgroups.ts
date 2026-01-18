import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { k8sApi } from "../../utils/k8s";
import { getPodGroupsInputSchema, getPodGroupInputSchema, getPodGroupYamlInputSchema } from "./schema";

export const podgroupsRouter = router({
    getPodGroups: procedure.input(getPodGroupsInputSchema).query(async ({ input }) => {
        const {
            namespace = "",
            search = "",
            status = "",
        } = input;

        console.log("Fetching podgroups with params:", {
            namespace,
            search,
            status,
        });

        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                plural: "podgroups",
            });
        } else {
            response = await k8sApi.listNamespacedCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                namespace,
                plural: "podgroups",
            });
        }

        // k8sApi (CustomObjectsApi) v1.2.0 ObjectParamAPI returns the body directly
        let filteredPodGroups = response.items || [];

        if (search) {
            filteredPodGroups = filteredPodGroups.filter((pg: any) =>
                pg.metadata.name
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            );
        }

        if (status && status !== "All") {
            filteredPodGroups = filteredPodGroups.filter(
                (pg: any) => pg.status?.phase === status,
            );
        }

        return {
            items: filteredPodGroups,
            totalCount: filteredPodGroups.length,
        };
    }),

    getPodGroup: procedure.input(getPodGroupInputSchema).query(async ({ input }) => {
        const { namespace, name } = input;
        const response = await k8sApi.getNamespacedCustomObject({
            group: "scheduling.volcano.sh",
            version: "v1beta1",
            namespace,
            plural: "podgroups",
            name,
        });
        return response;
    }),

    getPodGroupYaml: procedure
        .input(getPodGroupYamlInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            const response = await k8sApi.getNamespacedCustomObject({
                group: "scheduling.volcano.sh",
                version: "v1beta1",
                namespace,
                plural: "podgroups",
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
});

