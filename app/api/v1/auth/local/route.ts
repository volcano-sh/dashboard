import { handleLocalLogin } from "../../../../../lib/server/auth";

export const runtime = "nodejs";

export async function POST(request) {
    return handleLocalLogin(request);
}
