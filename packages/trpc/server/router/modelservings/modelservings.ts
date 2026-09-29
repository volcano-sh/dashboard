import yaml from "js-yaml";

import { procedure, router } from "../../trpc";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sApi } from "../../utils/k8s";
import {
    getKthenaResource,
    KTHENA_RESOURCES,
    listKthenaResources,
} from "../../utils/kthena";
import { getModelServingInputSchema, getModelServingsInputSchema } from "./schema";

const modelServing = KTHENA_RESOURCES.modelServing;

export const modelServingsRouter = router({
    getModelServings: procedure
        .input(getModelServingsInputSchema)
        .query(async ({ input }) => {
            const { page = 1, pageSize = 10 } = input;
            return listKthenaResources(k8sApi, modelServing, page, pageSize);
        }),
    getModelServing: procedure
        .input(getModelServingInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            try {
                return await getKthenaResource(k8sApi, modelServing, namespace, name);
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
    getModelServingYaml: procedure
        .input(getModelServingInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            try {
                const result = await getKthenaResource(
                    k8sApi,
                    modelServing,
                    namespace,
                    name,
                );
                if (!result.crdAvailable || !result.item) {
                    return { crdAvailable: false, yaml: "" };
                }
                return {
                    crdAvailable: true,
                    yaml: yaml.dump(result.item, {
                        indent: 2,
                        lineWidth: -1,
                        noRefs: true,
                        sortKeys: false,
                    }),
                };
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
});
