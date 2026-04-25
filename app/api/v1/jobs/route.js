import { createJob, listJobs } from "../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request) {
    return listJobs(request);
}

export async function POST(request) {
    return createJob(request);
}
