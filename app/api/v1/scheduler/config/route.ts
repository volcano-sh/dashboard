import { getKubernetesClients } from "../../../../../lib/server/kubernetes";
import { schedulerConfigJson } from "../../../../../lib/server/scheduler-config";

export const runtime = "nodejs";

export async function GET() {
    const { k8sCoreApi } = getKubernetesClients();
    return schedulerConfigJson(k8sCoreApi);
}
