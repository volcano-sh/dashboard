import {
    deleteCronJob,
    getCronJob,
    updateCronJob,
} from "../../../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(async (request, context) => {
    const { namespace, name } = await context.params;
    return getCronJob(namespace, name);
});

export const PUT = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return updateCronJob(request, namespace, name);
});

export const DELETE = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return deleteCronJob(namespace, name);
});
