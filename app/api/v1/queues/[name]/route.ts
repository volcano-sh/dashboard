import {
    deleteQueue,
    getQueue,
    patchQueue,
    updateQueue,
} from "../../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(async (request, context) => {
    const { name } = await context.params;
    return getQueue(name);
});

export const PUT = withWrite(async (request, context) => {
    const { name } = await context.params;
    return updateQueue(request, name);
});

export const PATCH = withWrite(async (request, context) => {
    const { name } = await context.params;
    return patchQueue(request, name);
});

export const DELETE = withWrite(async (request, context) => {
    const { name } = await context.params;
    return deleteQueue(name);
});
