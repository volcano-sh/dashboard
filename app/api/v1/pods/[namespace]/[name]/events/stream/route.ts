import { withRead } from "../../../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withRead(() => {
    return new Response("Pod event streaming requires a WebSocket upgrade.", {
        status: 426,
        headers: {
            Connection: "Upgrade",
            Upgrade: "websocket",
        },
    });
});
