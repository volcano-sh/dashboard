export const runtime = "nodejs";

export async function GET() {
    return new Response("Pod event streaming requires a WebSocket upgrade.", {
        status: 426,
        headers: {
            Connection: "Upgrade",
            Upgrade: "websocket",
        },
    });
}
