import { procedure, router } from "../../trpc";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sApi } from "../../utils/k8s";
import { resolveModelRouteRelated } from "../../utils/kthena-related";
import { getKthenaResource, KTHENA_RESOURCES } from "../../utils/kthena";
import { kthenaCrudFields, kthenaNameInputSchema } from "../kthena/crud";

const resource = KTHENA_RESOURCES.modelRoute;

export const modelRoutesRouter = router({
    ...kthenaCrudFields(resource),
    getRelated: procedure.input(kthenaNameInputSchema).query(async ({ input }) => {
        const { namespace, name } = input;
        try {
            const result = await getKthenaResource(k8sApi, resource, namespace, name);
            if (!result.crdAvailable || !result.item) {
                return { crdAvailable: false, modelServers: [], parentRefs: [] };
            }
            return {
                crdAvailable: true,
                ...resolveModelRouteRelated({
                    namespace,
                    modelRoute: result.item,
                }),
            };
        } catch (error) {
            throw new Error(formatK8sApiError(error));
        }
    }),
});
