import { handleApiRequest } from "../../../lib/server/volcano-api";

export const runtime = "nodejs";

const getPathSegments = async (context) => {
    const params = await context.params;
    return params?.path || [];
};

export async function GET(request, context) {
    return handleApiRequest(request, await getPathSegments(context));
}

export async function POST(request, context) {
    return handleApiRequest(request, await getPathSegments(context));
}

export async function PUT(request, context) {
    return handleApiRequest(request, await getPathSegments(context));
}

export async function PATCH(request, context) {
    return handleApiRequest(request, await getPathSegments(context));
}

export async function DELETE(request, context) {
    return handleApiRequest(request, await getPathSegments(context));
}
