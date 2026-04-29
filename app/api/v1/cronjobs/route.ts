import { listCronJobs } from "../../../../lib/server/volcano-api";

export const runtime = "nodejs";

export async function GET(request) {
    return listCronJobs(request);
}
