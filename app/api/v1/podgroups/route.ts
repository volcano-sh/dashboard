import {
    createPodGroup,
    listPodGroups,
} from "../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request) {
    return listPodGroups(request);
}

export async function POST(request) {
    return createPodGroup(request);
}
