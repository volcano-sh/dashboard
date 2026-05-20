import { handleSsoStart } from "../../../../../../lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
    return handleSsoStart(request);
}
