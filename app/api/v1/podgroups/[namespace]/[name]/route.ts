import {
    deletePodGroup,
    getPodGroup,
    patchPodGroup,
    updatePodGroup,
} from "../../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request, context) {
    const { namespace, name } = await context.params;
    return getPodGroup(namespace, name);
}

export async function PATCH(request, context) {
    const { namespace, name } = await context.params;
    return patchPodGroup(request, namespace, name);
}

export async function PUT(request, context) {
    const { namespace, name } = await context.params;
    return updatePodGroup(request, namespace, name);
}

export async function DELETE(request, context) {
    const { namespace, name } = await context.params;
    return deletePodGroup(namespace, name);
}
