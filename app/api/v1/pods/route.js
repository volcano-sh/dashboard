import { listPods } from "../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request) {
    return listPods(request);
}
