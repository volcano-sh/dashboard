import { getCronJobEvents } from "../../../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request, context) {
    const { namespace, name } = await context.params;
    return getCronJobEvents(namespace, name);
}
