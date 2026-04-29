import { handleAuthMe } from "../../../../../lib/server/auth";

export const runtime = "nodejs";

export async function GET(request) {
    return handleAuthMe(request);
}
