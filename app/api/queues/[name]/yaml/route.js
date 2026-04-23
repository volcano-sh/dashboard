import { getQueueYaml } from "../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request, context) {
    const { name } = await context.params;
    return getQueueYaml(name);
}
