import {
    deleteJob,
    getJob,
    patchJob,
} from "../../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

const getParams = async (context) => context.params;

export async function GET(request, context) {
    const { namespace, name } = await getParams(context);
    return getJob(namespace, name);
}

export async function PATCH(request, context) {
    const { namespace, name } = await getParams(context);
    return patchJob(request, namespace, name);
}

export async function DELETE(request, context) {
    const { namespace, name } = await getParams(context);
    return deleteJob(namespace, name);
}
