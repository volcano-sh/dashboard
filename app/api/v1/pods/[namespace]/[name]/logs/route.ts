import { getPodLogs } from "../../../../../../../lib/server/volcano-api";
import { withWrite } from "../../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return getPodLogs(request, namespace, name);
});
