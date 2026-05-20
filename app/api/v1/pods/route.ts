import { listPods } from "../../../../lib/server/volcano-api";
import { withRead } from "../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead((request) => {
    return listPods(request);
});
