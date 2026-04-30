import { getKubernetesClients } from "../../../../lib/server/kubernetes";
import { clusterInfoJson } from "../../../../lib/server/cluster-info";
import { withRead } from "../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(() => {
    const { kc } = getKubernetesClients();
    return clusterInfoJson(kc);
});
