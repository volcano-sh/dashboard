import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import next from "next";
import WebSocket, { WebSocketServer } from "ws";
import { AccessModes, verifyAuthToken } from "./lib/server/auth";
import {
    getDashboardConfig,
    getDashboardConfigSource,
} from "./lib/server/config";
import { getKubernetesClients } from "./lib/server/kubernetes";
import { isQueueOwnedPod } from "./lib/server/summary-mappers";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const nextHostname = hostname === "0.0.0.0" ? "localhost" : hostname;
const port = Number.parseInt(process.env.PORT || "3000", 10);

const createNextApp = next as unknown as (options: {
    dev: boolean;
    hostname: string;
    port: number;
}) => any;
const app = createNextApp({ dev, hostname: nextHostname, port });
const handle = app.getRequestHandler();

const terminalPathPattern = /^\/api\/v1\/pods\/([^/]+)\/([^/]+)\/terminal\/?$/;
const podLogsStreamPathPattern =
    /^\/api\/v1\/pods\/([^/]+)\/([^/]+)\/logs\/stream\/?$/;

const terminalCommand = "/bin/sh";
const kubernetesExecProtocols = [
    "v5.channel.k8s.io",
    "v4.channel.k8s.io",
    "v3.channel.k8s.io",
    "v2.channel.k8s.io",
    "channel.k8s.io",
];
const terminalStream = {
    stdin: 0,
    stdout: 1,
    stderr: 2,
    status: 3,
    resize: 4,
};
let terminalConnectionId = 0;
let logConnectionId = 0;

const logHttpRequest = (request, response, startedAt) => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const url = request.url || "/";
    const routeType = url.startsWith("/api/") ? "api" : "page";
    console.log(
        `[request] ${routeType} ${request.method} ${url} -> ${
            response.statusCode
        } ${durationMs.toFixed(1)}ms`,
    );
};

const rejectUpgradeUnauthorized = (socket, message) => {
    socket.write(
        "HTTP/1.1 401 Unauthorized\r\n" +
            "Connection: close\r\n" +
            "Content-Type: application/json\r\n" +
            "\r\n" +
            JSON.stringify({
                error: "Unauthorized",
                message: message || "Authentication required.",
            }),
    );
    socket.destroy();
};

const rejectUpgradeNotFound = (socket, message) => {
    socket.write(
        "HTTP/1.1 404 Not Found\r\n" +
            "Connection: close\r\n" +
            "Content-Type: application/json\r\n" +
            "\r\n" +
            JSON.stringify({
                error: "Not Found",
                message: message || "Endpoint is not available.",
            }),
    );
    socket.destroy();
};

const verifyVisiblePodForUpgrade = async (namespace, name) => {
    const { k8sCoreApi } = getKubernetesClients();
    const pod = await k8sCoreApi.readNamespacedPod({ namespace, name });
    return isQueueOwnedPod(pod);
};

const verifyUpgradeToken = async (url) => {
    const token = url.searchParams.get("token") || "";
    if (!token) {
        throw new Error("Missing websocket token.");
    }
    return verifyAuthToken(token);
};

const closeQuietly = (target) => {
    try {
        target?.close?.();
    } catch {
        // The session is already closing; there is nothing useful to surface.
    }
};

const summarizeDashboardConfig = (config) => ({
    access: {
        mode: config.access?.mode || AccessModes.READ_WRITE,
    },
    auth: {
        enabled: config.auth?.enabled !== false,
        mode: config.auth?.mode || "local",
        providerName:
            config.auth?.sso?.providerName ||
            config.auth?.sso?.provider_name ||
            "SSO",
        ssoEnabled: config.auth?.mode === "local-sso",
        users: Array.isArray(config.auth?.users)
            ? config.auth.users.length
            : Array.isArray(config.auth?.localUsers)
              ? config.auth.localUsers.length
              : 0,
    },
    schedulerConfig: {
        ControllersMetricEndpoint:
            config.schedulerConfig?.ControllersMetricEndpoint || "",
        SchedulerMetricEndpoint:
            config.schedulerConfig?.SchedulerMetricEndpoint || "",
        key: config.schedulerConfig?.key || "",
        name: config.schedulerConfig?.name || "",
        namespace: config.schedulerConfig?.namespace || "",
    },
});

const logDashboardConfig = async () => {
    const source = getDashboardConfigSource();
    const config = await getDashboardConfig();
    console.log("[config] dashboard source:");
    console.log(JSON.stringify(source, null, 2));
    console.log("[config] dashboard parsed:");
    console.log(JSON.stringify(summarizeDashboardConfig(config), null, 2));
};

let nextUpgradeHandler;
let readOnlyAccessMode = false;
let websocketRoutes = [];

const initializeServer = async () => {
    const dashboardConfig = await getDashboardConfig();
    const accessMode = dashboardConfig.access?.mode || AccessModes.READ_WRITE;
    readOnlyAccessMode = accessMode === AccessModes.READ_ONLY;
    websocketRoutes = readOnlyAccessMode
        ? []
        : [
              {
                  kind: "terminal",
                  pattern: terminalPathPattern,
              },
              {
                  kind: "pod-logs",
                  pattern: podLogsStreamPathPattern,
              },
          ];

    await app.prepare();
    await logDashboardConfig();

    // Route all websocket upgrades through one dispatcher. Next's custom-server
    // request handler normally auto-registers its own upgrade listener, but that
    // would also receive terminal sockets after our handler and close them. Use the
    // prepared internal upgrade handler for HMR instead of the public
    // getUpgradeHandler(), which does not handle Next 16 dev HMR correctly here.
    app.didWebSocketSetup = true;
    nextUpgradeHandler = app.upgradeHandler;
};

const matchWebsocketRoute = (pathname) => {
    for (const route of websocketRoutes) {
        const match = pathname.match(route.pattern);
        if (match) {
            return {
                ...route,
                match,
            };
        }
    }
    return null;
};

const server = createServer(async (request, response) => {
    const startedAt = process.hrtime.bigint();
    response.on("finish", () => {
        logHttpRequest(request, response, startedAt);
    });

    handle(request, response);
});

const terminalServer = new WebSocketServer({ noServer: true });
const podLogsServer = new WebSocketServer({ noServer: true });

const logTerminal = (message, context, details = "") => {
    const target = context
        ? `${context.namespace}/${context.name} (${context.container})`
        : "unknown";
    const id = context?.connectionId ? `#${context.connectionId} ` : "";
    console.log(
        `[terminal] ${id}${message}: ${target}${details ? ` ${details}` : ""}`,
    );
};

const logPodLogs = (message, context, details = "") => {
    const target = context
        ? `${context.namespace}/${context.name} (${context.container || "-"})`
        : "unknown";
    const id = context?.connectionId ? `#${context.connectionId} ` : "";
    console.log(
        `[pod-logs] ${id}${message}: ${target}${details ? ` ${details}` : ""}`,
    );
};

const createKubernetesExecSocket = async ({ container, name, namespace }) => {
    const { kc } = getKubernetesClients();
    const cluster = kc.getCurrentCluster();
    if (!cluster?.server) {
        throw new Error("No Kubernetes cluster is configured.");
    }

    const base = new URL(cluster.server);
    base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    base.pathname = `/api/v1/namespaces/${encodeURIComponent(
        namespace,
    )}/pods/${encodeURIComponent(name)}/exec`;
    base.search = "";

    const searchParams = base.searchParams;
    searchParams.set("container", container);
    searchParams.set("stdin", "true");
    searchParams.set("stdout", "true");
    searchParams.set("stderr", "true");
    searchParams.set("tty", "true");
    searchParams.append("command", terminalCommand);

    const options: any = {};
    await kc.applyToHTTPSOptions(options);
    return new WebSocket(base, kubernetesExecProtocols, options);
};

const createKubernetesPodLogRequest = async ({
    container,
    follow,
    name,
    namespace,
    tailLines,
}) => {
    const { kc } = getKubernetesClients();
    const cluster = kc.getCurrentCluster();
    if (!cluster?.server) {
        throw new Error("No Kubernetes cluster is configured.");
    }

    const url = new URL(cluster.server);
    url.pathname = `/api/v1/namespaces/${encodeURIComponent(
        namespace,
    )}/pods/${encodeURIComponent(name)}/log`;
    url.search = "";

    const searchParams = url.searchParams;
    if (container) {
        searchParams.set("container", container);
    }
    searchParams.set("follow", follow ? "true" : "false");
    searchParams.set("timestamps", "true");
    searchParams.set("tailLines", String(tailLines || 200));

    const options: any = {};
    await kc.applyToHTTPSOptions(options);

    const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;
    return {
        requestImpl,
        requestOptions: {
            ...options,
            headers: options.headers || {},
            method: "GET",
        },
        url,
    };
};

const frameKubernetesInput = (data, streamNumber) => {
    const payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return Buffer.concat([Buffer.from([streamNumber]), payload]);
};

terminalServer.on("connection", async (browserSocket, request, context) => {
    const connectionContext = {
        ...context,
        connectionId: ++terminalConnectionId,
    };
    let kubernetesSocket;
    const pendingInput = [];
    let kubernetesReady = false;
    let browserClosed = false;

    const send = (message) => {
        if (browserSocket.readyState === browserSocket.OPEN) {
            browserSocket.send(message);
        }
    };

    browserSocket.on("message", (message) => {
        const input = Buffer.isBuffer(message) ? message : Buffer.from(message);
        if (!kubernetesReady) {
            pendingInput.push(input);
            return;
        }
        kubernetesSocket.send(
            frameKubernetesInput(input, terminalStream.stdin),
        );
    });

    browserSocket.on("close", (code, reason) => {
        browserClosed = true;
        logTerminal(
            "browser websocket closed",
            connectionContext,
            `phase=${
                kubernetesReady ? "after-k8s-ready" : "before-k8s-ready"
            } code=${code} reason=${reason?.toString() || "-"}`,
        );
        closeQuietly(kubernetesSocket);
    });

    browserSocket.on("error", (error) => {
        browserClosed = true;
        logTerminal(
            "browser websocket error",
            connectionContext,
            `error=${error?.message || error}`,
        );
        closeQuietly(kubernetesSocket);
    });

    try {
        logTerminal("opening kubernetes exec websocket", connectionContext);
        kubernetesSocket = await createKubernetesExecSocket(connectionContext);

        kubernetesSocket.on("open", () => {
            kubernetesReady = true;
            logTerminal("kubernetes websocket open", connectionContext);

            if (browserClosed) {
                logTerminal(
                    "kubernetes websocket opened after browser close",
                    connectionContext,
                );
                closeQuietly(kubernetesSocket);
                return;
            }

            send(
                `Connected to ${connectionContext.namespace}/${connectionContext.name} (${connectionContext.container})\r\n`,
            );
            while (pendingInput.length > 0) {
                kubernetesSocket.send(
                    frameKubernetesInput(
                        pendingInput.shift(),
                        terminalStream.stdin,
                    ),
                );
            }
        });

        kubernetesSocket.on("message", (data) => {
            const frame = Buffer.isBuffer(data) ? data : Buffer.from(data);
            if (frame.length === 0) {
                return;
            }

            const streamNumber = frame.readUInt8(0);
            const payload = frame.subarray(1);

            if (
                streamNumber === terminalStream.stdout ||
                streamNumber === terminalStream.stderr
            ) {
                if (browserSocket.readyState === WebSocket.OPEN) {
                    browserSocket.send(payload.toString("utf8"));
                }
                return;
            }

            if (streamNumber === terminalStream.status) {
                const statusText = payload.toString("utf8");
                logTerminal(
                    "kubernetes exec status",
                    connectionContext,
                    statusText,
                );
                send(`\r\n[terminal status: ${statusText}]\r\n`);
                closeQuietly(browserSocket);
                return;
            }

            logTerminal(
                "kubernetes stream ignored",
                connectionContext,
                `stream=${streamNumber} bytes=${payload.length}`,
            );
        });

        kubernetesSocket.on("close", (code, reason) => {
            logTerminal(
                "kubernetes websocket closed",
                connectionContext,
                `code=${code} reason=${reason?.toString() || "-"}`,
            );
            closeQuietly(browserSocket);
        });

        kubernetesSocket.on("error", (error) => {
            logTerminal(
                "kubernetes websocket error",
                connectionContext,
                `error=${error?.message || error}`,
            );
            send(`Terminal connection failed: ${error?.message || error}\r\n`);
            closeQuietly(browserSocket);
        });
    } catch (error) {
        logTerminal(
            "kubernetes websocket failed",
            connectionContext,
            `error=${error?.message || error}`,
        );
        send(`Terminal connection failed: ${error?.message || error}\r\n`);
        closeQuietly(browserSocket);
    }
});

podLogsServer.on("connection", async (browserSocket, request, context) => {
    const connectionContext = {
        ...context,
        connectionId: ++logConnectionId,
    };
    let kubernetesRequest;

    const send = (message) => {
        if (browserSocket.readyState === WebSocket.OPEN) {
            browserSocket.send(message);
        }
    };

    browserSocket.on("close", (code, reason) => {
        logPodLogs(
            "browser websocket closed",
            connectionContext,
            `code=${code} reason=${reason?.toString() || "-"}`,
        );
        kubernetesRequest?.destroy();
    });

    browserSocket.on("error", (error) => {
        logPodLogs(
            "browser websocket error",
            connectionContext,
            `error=${error?.message || error}`,
        );
        kubernetesRequest?.destroy();
    });

    try {
        logPodLogs("opening kubernetes log stream", connectionContext);
        const { requestImpl, requestOptions, url } =
            await createKubernetesPodLogRequest(connectionContext);

        kubernetesRequest = requestImpl(url, requestOptions, (response) => {
            logPodLogs(
                "kubernetes log stream response",
                connectionContext,
                `status=${response.statusCode}`,
            );

            if ((response.statusCode || 500) >= 400) {
                let errorBody = "";
                response.setEncoding("utf8");
                response.on("data", (chunk) => {
                    errorBody += chunk;
                });
                response.on("end", () => {
                    send(
                        `Failed to open pod logs: ${response.statusCode} ${
                            response.statusMessage || ""
                        }\n${errorBody}`,
                    );
                    closeQuietly(browserSocket);
                });
                return;
            }

            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                send(chunk);
            });
            response.on("end", () => {
                logPodLogs("kubernetes log stream ended", connectionContext);
                closeQuietly(browserSocket);
            });
        });

        kubernetesRequest.on("error", (error) => {
            logPodLogs(
                "kubernetes log stream error",
                connectionContext,
                `error=${error?.message || error}`,
            );
            send(`Pod log stream failed: ${error?.message || error}\n`);
            closeQuietly(browserSocket);
        });

        kubernetesRequest.end();
    } catch (error) {
        logPodLogs(
            "kubernetes log stream failed",
            connectionContext,
            `error=${error?.message || error}`,
        );
        send(`Pod log stream failed: ${error?.message || error}\n`);
        closeQuietly(browserSocket);
    }
});

server.on("upgrade", async (request, socket, head) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const websocketRoute = matchWebsocketRoute(url.pathname);

    if (!websocketRoute) {
        const knownDisabledWebsocket =
            readOnlyAccessMode &&
            (terminalPathPattern.test(url.pathname) ||
                podLogsStreamPathPattern.test(url.pathname));
        if (knownDisabledWebsocket) {
            console.warn(
                `[upgrade] rejected disabled websocket path=${url.pathname} mode=${AccessModes.READ_ONLY}`,
            );
            rejectUpgradeNotFound(
                socket,
                "Endpoint is not available in read-only mode.",
            );
            return;
        }

        if (url.pathname.startsWith("/_next/webpack-hmr")) {
            console.log(`[upgrade] next-hmr path=${url.pathname}`);
        }
        Promise.resolve(nextUpgradeHandler(request, socket, head)).catch(
            (error) => {
                console.error(
                    `[upgrade] next handler failed path=${url.pathname} error=${
                        error?.stack || error?.message || error
                    }`,
                );
                socket.destroy();
            },
        );
        return;
    }

    if (!readOnlyAccessMode) {
        try {
            await verifyUpgradeToken(url);
        } catch (error) {
            console.warn(
                `[upgrade] rejected unauthenticated websocket path=${
                    url.pathname
                } error=${error?.message || error}`,
            );
            rejectUpgradeUnauthorized(
                socket,
                error?.message || "Authentication required.",
            );
            return;
        }
    }

    const namespace = decodeURIComponent(websocketRoute.match[1]);
    const name = decodeURIComponent(websocketRoute.match[2]);
    const container = url.searchParams.get("container");
    if (!namespace || !name || !container) {
        console.warn(
            `[upgrade] ${websocketRoute.kind} rejected missing parameter path=${url.pathname}`,
        );
        socket.destroy();
        return;
    }

    try {
        const visiblePod = await verifyVisiblePodForUpgrade(namespace, name);
        if (!visiblePod) {
            console.warn(
                `[upgrade] ${websocketRoute.kind} rejected pod without Volcano queue ${namespace}/${name}`,
            );
            rejectUpgradeNotFound(
                socket,
                "Pod is not associated with a Volcano queue or is not available.",
            );
            return;
        }
    } catch (error) {
        console.warn(
            `[upgrade] ${websocketRoute.kind} rejected inaccessible pod ${namespace}/${name} error=${
                error?.message || error
            }`,
        );
        rejectUpgradeNotFound(
            socket,
            "Pod is not associated with a Volcano queue or is not available.",
        );
        return;
    }

    if (websocketRoute.kind === "pod-logs") {
        const follow = url.searchParams.get("follow") !== "false";
        const tailLines = Number.parseInt(
            url.searchParams.get("tailLines") || "200",
            10,
        );
        console.log(
            `[upgrade] pod-logs ${namespace}/${name} (${container}) path=${url.pathname}`,
        );
        podLogsServer.handleUpgrade(request, socket, head, (websocket) => {
            podLogsServer.emit("connection", websocket, request, {
                container,
                follow,
                name,
                namespace,
                tailLines: Number.isFinite(tailLines) ? tailLines : 200,
            });
        });
        return;
    }

    console.log(
        `[upgrade] terminal ${namespace}/${name} (${container}) path=${url.pathname}`,
    );
    terminalServer.handleUpgrade(request, socket, head, (websocket) => {
        terminalServer.emit("connection", websocket, request, {
            container,
            name,
            namespace,
        });
    });
});

initializeServer()
    .then(() => {
        server.listen(port, hostname, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    })
    .catch((error) => {
        console.error(`[server] failed to start: ${error?.stack || error}`);
        process.exit(1);
    });
