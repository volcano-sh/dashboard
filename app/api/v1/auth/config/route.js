import { publicAuthConfig } from "../../../../../lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
    try {
        return Response.json(await publicAuthConfig());
    } catch (error) {
        return Response.json(
            {
                error: "Auth configuration error",
                message: error.message,
            },
            { status: 500 },
        );
    }
}
