import { createCronJob, listCronJobs } from "../../../../lib/server/volcano-api";
import { withRead, withWrite } from "../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead((request) => {
    return listCronJobs(request);
});

export const POST = withWrite((request) => {
    return createCronJob(request);
});
