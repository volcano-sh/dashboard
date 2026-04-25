import { getKubernetesClients } from "../../../../lib/server/kubernetes";
import { clusterInfoJson } from "../../../../lib/server/cluster-info";

export const runtime = "nodejs";

export async function GET() {
    const { kc } = getKubernetesClients();
    return clusterInfoJson(kc);
}
