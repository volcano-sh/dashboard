import { createQueue, listQueues } from "../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request) {
    return listQueues(request);
}

export async function POST(request) {
    return createQueue(request);
}
