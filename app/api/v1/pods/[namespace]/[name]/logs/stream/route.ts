import { withWrite } from "../../../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withWrite(() => {
    return new Response("Pod log streaming requires a WebSocket upgrade.", {
        status: 426,
        headers: {
            Connection: "Upgrade",
            Upgrade: "websocket",
        },
    });
});
