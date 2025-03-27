import { k8sCoreApi } from "../../../utils/k8s";
import { procedure, router } from "../../trpc";

export const namespaceRouter = router({
    getNamespaces: procedure.query(async () => {
        const response = await k8sCoreApi.listNamespace();
        return {
            items: response.items,
        };
    }),
});
