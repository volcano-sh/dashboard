import { procedure, router } from "../../trpc";
import { fetchNamespacedPods } from "../helpers";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sApi } from "../../utils/k8s";
import {
    extractWorkloadMatchLabels,
    matchLabelsSelector,
    resolveModelServerRelated,
} from "../../utils/kthena-related";
import {
    getKthenaResource,
    KTHENA_RESOURCES,
    listNamespacedKthenaResources,
} from "../../utils/kthena";
import { kthenaCrudFields, kthenaNameInputSchema } from "../kthena/crud";

const resource = KTHENA_RESOURCES.modelServer;

export const modelServersRouter = router({
    ...kthenaCrudFields(resource),
    getRelated: procedure.input(kthenaNameInputSchema).query(async ({ input }) => {
        const { namespace, name } = input;
        try {
            const result = await getKthenaResource(k8sApi, resource, namespace, name);
            if (!result.crdAvailable || !result.item) {
                return { crdAvailable: false, pods: [], modelRoutes: [] };
            }

            const labels = extractWorkloadMatchLabels(result.item);
            const selector = matchLabelsSelector(labels);
            const [pods, routes] = await Promise.all([
                selector ? fetchNamespacedPods(namespace, selector) : Promise.resolve([]),
                listNamespacedKthenaResources(k8sApi, KTHENA_RESOURCES.modelRoute, namespace),
            ]);

            return {
                crdAvailable: true,
                ...resolveModelServerRelated({
                    namespace,
                    name,
                    modelServer: result.item,
                    pods,
                    modelRoutes: routes.items,
                }),
            };
        } catch (error) {
            throw new Error(formatK8sApiError(error));
        }
    }),
});
