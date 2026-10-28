import { procedure, router } from "../../trpc";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sApi } from "../../utils/k8s";
import { resolveModelBoosterRelated } from "../../utils/kthena-related";
import {
    getKthenaResource,
    KTHENA_RESOURCES,
    listNamespacedKthenaResources,
} from "../../utils/kthena";
import { kthenaCrudFields, kthenaNameInputSchema } from "../kthena/crud";

const resource = KTHENA_RESOURCES.modelBooster;

export const modelBoostersRouter = router({
    ...kthenaCrudFields(resource),
    getRelated: procedure.input(kthenaNameInputSchema).query(async ({ input }) => {
        const { namespace, name } = input;
        try {
            const result = await getKthenaResource(k8sApi, resource, namespace, name);
            if (!result.crdAvailable || !result.item) {
                return {
                    crdAvailable: false,
                    modelServings: [],
                    modelServers: [],
                    modelRoutes: [],
                };
            }

            const [servings, servers, routes] = await Promise.all([
                listNamespacedKthenaResources(k8sApi, KTHENA_RESOURCES.modelServing, namespace),
                listNamespacedKthenaResources(k8sApi, KTHENA_RESOURCES.modelServer, namespace),
                listNamespacedKthenaResources(k8sApi, KTHENA_RESOURCES.modelRoute, namespace),
            ]);

            return {
                crdAvailable: true,
                ...resolveModelBoosterRelated({
                    namespace,
                    name,
                    modelServings: servings.items,
                    modelServers: servers.items,
                    modelRoutes: routes.items,
                }),
            };
        } catch (error) {
            throw new Error(formatK8sApiError(error));
        }
    }),
});
