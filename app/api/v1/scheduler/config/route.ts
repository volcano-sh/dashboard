import { getKubernetesClients } from "../../../../../lib/server/kubernetes";
import { schedulerConfigJson } from "../../../../../lib/server/scheduler-config";
import { withRead } from "../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(() => {
    const { k8sCoreApi } = getKubernetesClients();
    return schedulerConfigJson(k8sCoreApi);
});
