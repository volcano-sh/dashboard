import { getJobEvents } from "../../../../../../../lib/server/volcano-api";
import { withRead } from "../../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(async (request, { params }) => {
    const { namespace, name } = await params;
    return getJobEvents(namespace, name);
});
