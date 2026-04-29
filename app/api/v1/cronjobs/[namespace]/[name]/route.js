import {
    deleteCronJob,
    getCronJob,
} from "../../../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request, context) {
    const { namespace, name } = await context.params;
    return getCronJob(namespace, name);
}

export async function DELETE(request, context) {
    const { namespace, name } = await context.params;
    return deleteCronJob(namespace, name);
}
