import {
    deleteJob,
    getJob,
    patchJob,
    updateJob,
} from "../../../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../../../lib/server/auth";

export const runtime = "nodejs";

const getParams = async (context) => context.params;

export const GET = withRead(async (request, context) => {
    const { namespace, name } = await getParams(context);
    return getJob(namespace, name);
});

export const PATCH = withWrite(async (request, context) => {
    const { namespace, name } = await getParams(context);
    return patchJob(request, namespace, name);
});

export const PUT = withWrite(async (request, context) => {
    const { namespace, name } = await getParams(context);
    return updateJob(request, namespace, name);
});

export const DELETE = withWrite(async (request, context) => {
    const { namespace, name } = await getParams(context);
    return deleteJob(namespace, name);
});
