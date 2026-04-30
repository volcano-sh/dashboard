import {
    deletePodGroup,
    getPodGroup,
    patchPodGroup,
    updatePodGroup,
} from "../../../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(async (request, context) => {
    const { namespace, name } = await context.params;
    return getPodGroup(namespace, name);
});

export const PATCH = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return patchPodGroup(request, namespace, name);
});

export const PUT = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return updatePodGroup(request, namespace, name);
});

export const DELETE = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    return deletePodGroup(namespace, name);
});
