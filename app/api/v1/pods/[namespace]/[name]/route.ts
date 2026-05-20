import { deletePod, getPod } from "../../../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(async (request, context) => {
    const { namespace, name } = await context.params;
    return getPod(namespace, name);
});

export const DELETE = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return deletePod(namespace, name);
});
