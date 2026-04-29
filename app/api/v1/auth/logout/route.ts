export const runtime = "nodejs";

export async function POST() {
    return Response.json({ message: "Logged out" });
}
