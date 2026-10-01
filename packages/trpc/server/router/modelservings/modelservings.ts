import yaml from "js-yaml";

import { procedure, router } from "../../trpc";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sApi } from "../../utils/k8s";
import {
    createKthenaResource,
    deleteKthenaResource,
    getKthenaResource,
    KTHENA_RESOURCES,
    listKthenaResources,
    replaceKthenaResource,
} from "../../utils/kthena";
import {
    createModelServingInputSchema,
    deleteModelServingInputSchema,
    getModelServingInputSchema,
    getModelServingsInputSchema,
    updateModelServingInputSchema,
} from "./schema";

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
    createModelServing: procedure
        .input(createModelServingInputSchema)
        .mutation(async ({ input }) => {
            try {
                const data = await createKthenaResource(
                    k8sApi,
                    modelServing,
                    input.manifest,
                );
                return { message: "ModelServing created successfully", data };
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
    updateModelServing: procedure
        .input(updateModelServingInputSchema)
        .mutation(async ({ input }) => {
            try {
                const data = await replaceKthenaResource(
                    k8sApi,
                    modelServing,
                    input.namespace,
                    input.name,
                    input.patchData,
                );
                return { message: "ModelServing updated successfully", data };
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
    deleteModelServing: procedure
        .input(deleteModelServingInputSchema)
        .mutation(async ({ input }) => {
            try {
                const data = await deleteKthenaResource(
                    k8sApi,
                    modelServing,
                    input.namespace,
                    input.name,
                );
                return { message: "ModelServing deleted successfully", data };
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
});
