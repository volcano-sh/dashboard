import { getKubernetesClients } from "../../../../../lib/server/kubernetes";
import { schedulerConfigYaml } from "../../../../../lib/server/scheduler-config";

export const runtime = "nodejs";

export async function GET() {
    const { k8sCoreApi } = getKubernetesClients();
    return schedulerConfigYaml(k8sCoreApi);
}
