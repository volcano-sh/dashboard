import {
    deleteQueue,
    getQueue,
    updateQueue,
} from "../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request, context) {
    const { name } = await context.params;
    return getQueue(name);
}

export async function PUT(request, context) {
    const { name } = await context.params;
    return updateQueue(request, name);
}

export async function PATCH(request, context) {
    const { name } = await context.params;
    return updateQueue(request, name);
}

export async function DELETE(request, context) {
    const { name } = await context.params;
    return deleteQueue(name);
}
