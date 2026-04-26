import { getJobEvents } from "../../../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request, { params }) {
    const { namespace, name } = await params;
    return getJobEvents(namespace, name);
}
