import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import * as demoHandlers from "../../demo/handlers";
import { isDemoMode } from "../../utils/demo";
import { k8sApi } from "../../utils/k8s";
import { fetchPodGroups } from "../helpers";
import { getPodGroupsInputSchema, getPodGroupInputSchema, getPodGroupYamlInputSchema } from "./schema";

export const podgroupsRouter = router({
    getPodGroups: procedure.input(getPodGroupsInputSchema).query(async ({ input }) => {
        const {
            namespace = "",
            search = "",
            status = "",
            page = 1,
            pageSize = 10,
        } = input;

        if (isDemoMode()) {
            return demoHandlers.getDemoPodGroups(page, pageSize, {
                namespace,
                search,
                status,
            });
        }

        return fetchPodGroups(page, pageSize, { namespace, search, status });
    }),

    getPodGroup: procedure.input(getPodGroupInputSchema).query(async ({ input }) => {
        if (isDemoMode()) {
            return demoHandlers.getDemoPodGroup(input.namespace, input.name);
        }
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
            if (isDemoMode()) {
                return demoHandlers.getDemoPodGroupYaml(
                    input.namespace,
                    input.name,
                );
            }
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
