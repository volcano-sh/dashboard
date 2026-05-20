import { handleLocalLogin } from "../../../../../lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
    return handleLocalLogin(request);
}
