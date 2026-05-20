import { createJob, listJobs } from "../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead((request) => {
    return listJobs(request);
});

export const POST = withWrite((request) => {
    return createJob(request);
});
