import { json } from "../../../../../../../lib/server/api-utils";
import { withWrite } from "../../../../../../../lib/server/auth";

export const runtime = "nodejs";

export const GET = withWrite(async (request, context) => {
    const { namespace, name } = await context.params;
    const url = new URL(request.url);

    return json(
        {
            endpoint: `/api/v1/pods/${namespace}/${name}/terminal`,
            message:
                "This endpoint is a WebSocket terminal endpoint. Connect with ws:// or wss:// and include a container query parameter.",
            query: {
                container: url.searchParams.get("container") || "<required>",
            },
            shell: "The server starts an interactive terminal automatically and falls back across common shells.",
            upgrade: "websocket",
        },
        426,
    );
});
