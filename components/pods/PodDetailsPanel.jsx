import React from "react";
import Editor from "@monaco-editor/react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery } from "@tanstack/react-query";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PodStatusChip from "./PodStatusChip";
import {
    fetchPodEvents,
    fetchPod,
    fetchPodLogs,
    fetchPodYaml,
    getApiErrorMessage,
    API_BASE,
} from "../../lib/client/dashboard-api";
import { calculateAge } from "../utils";

const panelBorder = "#dfe3e8";
const panelBg = "#ffffff";
const subtleBg = "#f7f8fa";

const detailLabelSx = {
    color: "text.secondary",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.01em",
};

const detailValueSx = {
    color: "text.primary",
    fontFamily:
        '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 12.5,
};

const headerMetaLabelSx = {
    color: "text.secondary",
    fontSize: 12,
    fontWeight: 500,
};

const headerMetaValueSx = {
    color: "text.primary",
    fontSize: 12.5,
    fontWeight: 500,
};

const sectionTitleSx = {
    fontSize: 14,
    fontWeight: 700,
    mb: 1.25,
};

const sectionCardSx = {
    bgcolor: "#ffffff",
    border: `1px solid ${panelBorder}`,
    borderRadius: 1,
    boxShadow: "none",
    p: 2,
};

const resourceCellValue = (container, group, name) =>
    container?.resources?.[group]?.[name] || "-";

const podStatus = (pod) =>
    pod?.status?.phase || pod?.summary?.status || "Unknown";

const podJobName = (pod) =>
    pod?.metadata?.labels?.["volcano.sh/job-name"] ||
    pod?.metadata?.labels?.job ||
    "-";

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "-";

const PlainTable = ({ columns, rows, emptyText = "-" }) => (
    <Table
        size="small"
        sx={{
            border: `1px solid ${panelBorder}`,
            borderRadius: 1,
            overflow: "hidden",
            "& .MuiTableCell-root": {
                borderBottom: `1px solid ${panelBorder}`,
                fontSize: 12.5,
                px: 1.5,
                py: 1,
            },
            "& .MuiTableHead-root .MuiTableCell-root": {
                bgcolor: subtleBg,
                fontWeight: 700,
            },
            "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root":
                {
                    borderBottom: 0,
                },
        }}
    >
        <TableHead>
            <TableRow>
                {columns.map((column) => (
                    <TableCell key={column.key}>{column.label}</TableCell>
                ))}
            </TableRow>
        </TableHead>
        <TableBody>
            {rows.length === 0 ? (
                <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        sx={{ color: "text.secondary", textAlign: "center" }}
                    >
                        {emptyText}
                    </TableCell>
                </TableRow>
            ) : (
                rows.map((row, index) => (
                    <TableRow key={`${columns[0].key}-${index}`}>
                        {columns.map((column) => (
                            <TableCell key={column.key}>
                                {row[column.key] ?? "-"}
                            </TableCell>
                        ))}
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
);

const DetailGridRow = ({ label, value }) => (
    <Box
        sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "132px minmax(0, 1fr)",
            py: 0.5,
        }}
    >
        <Typography sx={detailLabelSx}>{label}</Typography>
        <Typography sx={detailValueSx}>{value}</Typography>
    </Box>
);

const SectionCard = ({ children, sx, title }) => (
    <Box sx={{ ...sectionCardSx, ...sx }}>
        <Typography sx={sectionTitleSx}>{title}</Typography>
        {children}
    </Box>
);

const PlaceholderPanel = ({ title }) => (
    <Box
        sx={{
            alignItems: "center",
            border: `1px dashed ${panelBorder}`,
            borderRadius: 1,
            color: "text.secondary",
            display: "flex",
            fontSize: 13,
            justifyContent: "center",
            minHeight: 220,
            px: 2,
            textAlign: "center",
        }}
    >
        {title} is not wired up yet for the live cluster API.
    </Box>
);

const monospaceSx = {
    fontFamily:
        '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
};

const terminalSx = {
    bgcolor: "#171717",
    border: "1px solid #242424",
    borderRadius: 1,
    color: "#e5e7eb",
    ...monospaceSx,
    fontSize: 12.5,
    lineHeight: 1.55,
    m: 0,
    minHeight: 520,
    overflow: "auto",
    p: 2,
    whiteSpace: "pre",
};

const lineLevelColor = (line) => {
    if (/\b(ERROR|ERR|FATAL|PANIC)\b/i.test(line)) {
        return "#f87171";
    }
    if (/\b(WARN|WARNING)\b/i.test(line)) {
        return "#facc15";
    }
    if (/\b(INFO)\b/i.test(line)) {
        return "#4ade80";
    }
    if (/\b(DEBUG|TRACE)\b/i.test(line)) {
        return "#93c5fd";
    }
    return "#e5e7eb";
};

const terminalSessions = new Map();

const podLogsStreamUrl = ({ container, name, namespace, tailLines }) => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const params = new URLSearchParams({
        container,
        follow: "true",
        tailLines: String(tailLines || 200),
    });
    return `${protocol}://${window.location.host}${API_BASE}/pods/${encodeURIComponent(
        namespace,
    )}/${encodeURIComponent(name)}/logs/stream?${params.toString()}`;
};

const getTerminalSession = (key, url) => {
    const existing = terminalSessions.get(key);
    if (existing) {
        if (existing.closeTimer) {
            window.clearTimeout(existing.closeTimer);
            existing.closeTimer = null;
        }
        return existing;
    }

    const session = {
        buffer: [],
        closeTimer: null,
        connected: false,
        listeners: new Set(),
        socket: new WebSocket(url),
    };

    const emit = (event) => {
        session.listeners.forEach((listener) => listener(event));
    };

    session.socket.addEventListener("open", () => {
        emit({ type: "open" });
    });

    session.socket.addEventListener("message", (event) => {
        const data =
            typeof event.data === "string" ? event.data : String(event.data);
        if (data.startsWith("Connected to ")) {
            session.connected = true;
        }
        session.buffer.push(data);
        emit({ data, type: "message" });
    });

    session.socket.addEventListener("close", (event) => {
        const wasConnected = session.connected;
        session.connected = false;
        terminalSessions.delete(key);
        emit({ event, type: "close", wasConnected });
    });

    session.socket.addEventListener("error", (event) => {
        emit({ event, type: "error" });
    });

    terminalSessions.set(key, session);
    return session;
};

const releaseTerminalSession = (key) => {
    const session = terminalSessions.get(key);
    if (!session || session.closeTimer) {
        return;
    }

    session.closeTimer = window.setTimeout(() => {
        if (session.socket.readyState === WebSocket.OPEN) {
            session.socket.close(1000, "terminal panel detached");
        } else if (session.socket.readyState === WebSocket.CONNECTING) {
            session.socket.close();
        }
        terminalSessions.delete(key);
    }, 5000);
};

const LogTerminal = ({ content, terminalRef }) => {
    const lines = (content || "No logs available.").split("\n");

    return (
        <Box component="pre" ref={terminalRef} sx={terminalSx}>
            {lines.map((line, index) => {
                const match = line.match(
                    /^(\S+\s+)?(INFO|WARN|WARNING|ERROR|ERR|DEBUG|TRACE|FATAL|PANIC)\b(.*)$/i,
                );

                return (
                    <Box
                        component="span"
                        key={`${index}-${line.slice(0, 20)}`}
                        sx={{ display: "block" }}
                    >
                        <Box
                            component="span"
                            sx={{
                                color: "#6b7280",
                                display: "inline-block",
                                pr: 2,
                                textAlign: "right",
                                width: 36,
                            }}
                        >
                            {index + 1}
                        </Box>
                        {match ? (
                            <>
                                <Box component="span" sx={{ color: "#cbd5e1" }}>
                                    {match[1] || ""}
                                </Box>
                                <Box
                                    component="span"
                                    sx={{
                                        color: lineLevelColor(match[2]),
                                        fontWeight: 700,
                                        pr: 1.5,
                                    }}
                                >
                                    {match[2].toUpperCase()}
                                </Box>
                                <Box component="span">{match[3]}</Box>
                            </>
                        ) : (
                            <Box
                                component="span"
                                sx={{ color: lineLevelColor(line) }}
                            >
                                {line}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

const PodOverview = ({ pod }) => {
    const labels = Object.entries(pod?.metadata?.labels || {});
    const annotations = Object.entries(pod?.metadata?.annotations || {});
    const conditions = (pod?.status?.conditions || []).map((condition) => ({
        message: condition.message || "-",
        reason: condition.reason || "-",
        status: condition.status || "-",
        type: condition.type || "-",
    }));
    const containers = (pod?.spec?.containers || []).map((container) => {
        const containerStatus = (pod?.status?.containerStatuses || []).find(
            (status) => status.name === container.name,
        );
        return {
            image: container.image || "-",
            name: container.name || "-",
            ready: containerStatus
                ? `${containerStatus.ready ? 1 : 0}/1`
                : "0/1",
            restarts: containerStatus?.restartCount ?? 0,
            status: (
                <PodStatusChip
                    status={
                        containerStatus?.state?.running
                            ? "Running"
                            : containerStatus?.state?.waiting?.reason ||
                              containerStatus?.state?.terminated?.reason ||
                              "Waiting"
                    }
                />
            ),
        };
    });
    const resources = (pod?.spec?.containers || []).flatMap((container) =>
        ["cpu", "memory", "nvidia.com/gpu"].map((resource) => ({
            container: container.name || "-",
            limits: resourceCellValue(container, "limits", resource),
            requests: resourceCellValue(container, "requests", resource),
            resource:
                resource === "nvidia.com/gpu"
                    ? "GPU (nvidia.com/gpu)"
                    : resource.toUpperCase(),
        })),
    );
    const volumes = (pod?.spec?.volumes || []).map((volume) => ({
        mountPath:
            (pod?.spec?.containers || [])
                .flatMap((container) => container.volumeMounts || [])
                .find((mount) => mount.name === volume.name)?.mountPath || "-",
        name: volume.name || "-",
        type: Object.keys(volume).find((key) => key !== "name") || "-",
    }));

    return (
        <Box sx={{ display: "grid", gap: 1.75 }}>
            <Box
                sx={{
                    display: "grid",
                    gap: 1.75,
                    gridTemplateColumns: {
                        xs: "1fr",
                        xl: "minmax(0, 1fr) minmax(0, 1fr)",
                    },
                }}
            >
                <SectionCard title="Basic Information">
                    <Box sx={{ display: "grid", gap: 0.4 }}>
                        <DetailGridRow
                            label="Namespace"
                            value={pod?.metadata?.namespace || "-"}
                        />
                        <DetailGridRow label="Job" value={podJobName(pod)} />
                        <DetailGridRow
                            label="Node"
                            value={pod?.spec?.nodeName || "-"}
                        />
                        <DetailGridRow
                            label="Pod IP"
                            value={pod?.status?.podIP || "-"}
                        />
                        <DetailGridRow
                            label="Created"
                            value={formatDateTime(
                                pod?.metadata?.creationTimestamp,
                            )}
                        />
                        <DetailGridRow
                            label="Age"
                            value={
                                pod?.metadata?.creationTimestamp
                                    ? calculateAge(
                                          pod.metadata.creationTimestamp,
                                      )
                                    : "-"
                            }
                        />
                        <Box
                            sx={{
                                display: "grid",
                                gap: 1,
                                gridTemplateColumns: "132px minmax(0, 1fr)",
                                py: 0.5,
                            }}
                        >
                            <Typography sx={detailLabelSx}>Labels</Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.75,
                                }}
                            >
                                {labels.length === 0 ? (
                                    <Typography sx={detailValueSx}>
                                        -
                                    </Typography>
                                ) : (
                                    labels.slice(0, 3).map(([key, value]) => (
                                        <PodStatusChip
                                            key={key}
                                            status={`${key}=${value}`}
                                            sx={{
                                                bgcolor: "#ffffff",
                                                border: "1px solid #d0d5dd",
                                                color: "#4b5563",
                                                fontWeight: 500,
                                                maxWidth: "100%",
                                            }}
                                        />
                                    ))
                                )}
                                {labels.length > 3 && (
                                    <PodStatusChip
                                        status={`+${labels.length - 3}`}
                                        sx={{
                                            bgcolor: "#ffffff",
                                            border: "1px solid #d0d5dd",
                                            color: "#4b5563",
                                            fontWeight: 500,
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                        <DetailGridRow
                            label="Annotations"
                            value={annotations.length || "-"}
                        />
                        <DetailGridRow
                            label="Restart Policy"
                            value={pod?.spec?.restartPolicy || "-"}
                        />
                        <DetailGridRow
                            label="QoS Class"
                            value={pod?.status?.qosClass || "-"}
                        />
                    </Box>
                </SectionCard>

                <SectionCard title="Status">
                    <Box sx={{ display: "grid", gap: 1.25 }}>
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "grid",
                                gap: 1,
                                gridTemplateColumns: "96px minmax(0, 1fr)",
                            }}
                        >
                            <Typography sx={detailLabelSx}>Phase</Typography>
                            <PodStatusChip status={podStatus(pod)} />
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    ...detailLabelSx,
                                    fontWeight: 700,
                                    mb: 1,
                                }}
                            >
                                Conditions
                            </Typography>
                            <PlainTable
                                columns={[
                                    { key: "type", label: "Type" },
                                    { key: "status", label: "Status" },
                                    { key: "reason", label: "Reason" },
                                    { key: "message", label: "Message" },
                                ]}
                                rows={conditions}
                                emptyText="No pod conditions available."
                            />
                        </Box>
                    </Box>
                </SectionCard>
            </Box>

            <SectionCard title="Containers">
                <PlainTable
                    columns={[
                        { key: "name", label: "Name" },
                        { key: "image", label: "Image" },
                        { key: "status", label: "Status" },
                        { key: "ready", label: "Ready" },
                        { key: "restarts", label: "Restarts" },
                    ]}
                    rows={containers}
                    emptyText="No containers found."
                />
            </SectionCard>

            <Box
                sx={{
                    display: "grid",
                    gap: 1.75,
                    gridTemplateColumns: {
                        xs: "1fr",
                        xl: "minmax(0, 1fr) minmax(0, 1fr)",
                    },
                }}
            >
                <SectionCard title="Resource Requests / Limits">
                    <PlainTable
                        columns={[
                            { key: "container", label: "Container" },
                            { key: "resource", label: "Resource" },
                            { key: "requests", label: "Requests" },
                            { key: "limits", label: "Limits" },
                        ]}
                        rows={resources}
                        emptyText="No resource requirements found."
                    />
                </SectionCard>

                <SectionCard title="Volumes">
                    <PlainTable
                        columns={[
                            { key: "name", label: "Name" },
                            { key: "type", label: "Type" },
                            { key: "mountPath", label: "Mount Path" },
                        ]}
                        rows={volumes}
                        emptyText="No volumes configured."
                    />
                </SectionCard>
            </Box>
        </Box>
    );
};

const PodYamlView = ({ namespace, name, enabled }) => {
    const { data, error, isFetching, isLoading } = useQuery({
        enabled,
        queryFn: () => fetchPodYaml(namespace, name),
        queryKey: ["podYaml", namespace, name],
    });

    if (isLoading || isFetching) {
        return (
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    minHeight: 220,
                }}
            >
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ boxShadow: "none" }}>
                {getApiErrorMessage(error, "Failed to fetch pod YAML")}
            </Alert>
        );
    }

    return (
        <Box
            sx={{
                "& .monaco-editor, & .monaco-editor-background": {
                    bgcolor: subtleBg,
                },
            }}
        >
            <Editor
                height="620px"
                language="yaml"
                options={{
                    domReadOnly: true,
                    folding: true,
                    fontFamily:
                        '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: 12.5,
                    lineNumbersMinChars: 3,
                    minimap: { enabled: false },
                    overviewRulerBorder: false,
                    padding: { top: 12, bottom: 12 },
                    readOnly: true,
                    renderLineHighlight: "none",
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    wordWrap: "on",
                }}
                theme="vs"
                value={data || ""}
            />
        </Box>
    );
};

const PodLogsView = ({
    container,
    containers,
    follow,
    name,
    namespace,
    onContainerChange,
    onFollowChange,
    onTailLinesChange,
    tailLines,
}) => {
    const [streamContent, setStreamContent] = React.useState("");
    const [streamError, setStreamError] = React.useState("");
    const [streamRefreshKey, setStreamRefreshKey] = React.useState(0);
    const [streamStatus, setStreamStatus] = React.useState("idle");
    const streamContentRef = React.useRef("");
    const terminalRef = React.useRef(null);
    const { data, error, isFetching, isLoading, refetch } = useQuery({
        enabled: Boolean(namespace && name && !follow),
        queryFn: () =>
            fetchPodLogs(namespace, name, {
                container,
                tailLines,
            }),
        queryKey: ["podLogs", namespace, name, container, tailLines],
    });
    const displayedLogs = follow ? streamContent : data || "";
    const displayedError = follow ? streamError : error;
    const isLogsLoading =
        follow && streamStatus === "connecting"
            ? !streamContent
            : isLoading || isFetching;

    React.useEffect(() => {
        if (!follow || !namespace || !name || !container) {
            setStreamStatus("idle");
            setStreamError("");
            return undefined;
        }

        let disposed = false;
        const socket = new WebSocket(
            podLogsStreamUrl({ container, name, namespace, tailLines }),
        );

        setStreamContent("");
        streamContentRef.current = "";
        setStreamError("");
        setStreamStatus("connecting");

        socket.addEventListener("open", () => {
            if (!disposed) {
                setStreamStatus("connected");
            }
        });

        socket.addEventListener("message", (event) => {
            if (disposed) {
                return;
            }
            const chunk =
                typeof event.data === "string"
                    ? event.data
                    : String(event.data);
            setStreamContent((current) => {
                const next = `${current}${chunk}`;
                streamContentRef.current = next;
                return next;
            });
        });

        socket.addEventListener("error", () => {
            if (!disposed) {
                setStreamError("Pod log stream connection failed.");
                setStreamStatus("error");
            }
        });

        socket.addEventListener("close", (event) => {
            if (disposed) {
                return;
            }
            setStreamStatus("closed");
            if (!event.wasClean && !streamContentRef.current) {
                setStreamError(
                    `Pod log stream closed unexpectedly (${event.code || 1006}).`,
                );
            }
        });

        return () => {
            disposed = true;
            socket.close(1000, "logs panel detached");
        };
    }, [container, follow, name, namespace, streamRefreshKey, tailLines]);

    React.useEffect(() => {
        if (!follow || !terminalRef.current) {
            return;
        }
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [displayedLogs, follow]);

    const handleCopyLogs = async () => {
        await navigator.clipboard?.writeText(displayedLogs || "");
    };

    const handleDownloadLogs = () => {
        const blob = new Blob([displayedLogs || ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${name || "pod"}.log`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const toolbar = (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                mb: 1.5,
            }}
        >
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ alignItems: { xs: "stretch", sm: "center" } }}
            >
                <Typography sx={detailLabelSx}>Container</Typography>
                <Select
                    onChange={(event) => onContainerChange(event.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                    value={container}
                >
                    {(containers.length ? containers : [container || "main"]).map(
                        (item) => (
                            <MenuItem key={item} value={item}>
                                {item}
                            </MenuItem>
                        ),
                    )}
                </Select>
            </Stack>

            <Stack
                direction="row"
                spacing={1.25}
                sx={{
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                    rowGap: 1,
                }}
            >
                <FormControlLabel
                    control={
                        <Switch
                            checked={follow}
                            color="primary"
                            onChange={(event) =>
                                onFollowChange(event.target.checked)
                            }
                            size="small"
                        />
                    }
                    label="Follow"
                    sx={{
                        color: "text.secondary",
                        m: 0,
                        "& .MuiFormControlLabel-label": {
                            fontSize: 12,
                            fontWeight: 600,
                        },
                    }}
                />
                {follow && (
                    <Typography
                        sx={{
                            color:
                                streamStatus === "connected"
                                    ? "success.main"
                                    : streamStatus === "error"
                                      ? "error.main"
                                      : "text.secondary",
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {streamStatus === "connected"
                            ? "Live"
                            : streamStatus === "connecting"
                              ? "Connecting"
                              : streamStatus === "closed"
                                ? "Closed"
                                : "Idle"}
                    </Typography>
                )}
                <Typography sx={detailLabelSx}>Tail</Typography>
                <Select
                    onChange={(event) =>
                        onTailLinesChange(Number(event.target.value))
                    }
                    size="small"
                    sx={{ minWidth: 150 }}
                    value={tailLines}
                >
                    {[50, 100, 200, 500, 1000].map((value) => (
                        <MenuItem key={value} value={value}>
                            Last {value} lines
                        </MenuItem>
                    ))}
                </Select>
                <IconButton
                    aria-label="refresh logs"
                    onClick={() => {
                        if (follow) {
                            setStreamContent("");
                            streamContentRef.current = "";
                            setStreamRefreshKey((current) => current + 1);
                            return;
                        }
                        refetch();
                    }}
                    size="small"
                    sx={{
                        border: `1px solid ${panelBorder}`,
                        borderRadius: 1,
                        height: 38,
                        width: 38,
                    }}
                >
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Stack>
    );

    if (isLogsLoading) {
        return (
            <Box>
                {toolbar}
                <Box
                    sx={{
                        alignItems: "center",
                        bgcolor: "#171717",
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "center",
                        minHeight: 520,
                    }}
                >
                    <CircularProgress size={22} />
                </Box>
            </Box>
        );
    }

    if (displayedError) {
        return (
            <Box>
                {toolbar}
                <Alert severity="error" sx={{ boxShadow: "none" }}>
                    {typeof displayedError === "string"
                        ? displayedError
                        : getApiErrorMessage(
                              displayedError,
                              "Failed to fetch pod logs",
                          )}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ position: "relative" }}>
            {toolbar}
            <Box sx={{ position: "relative" }}>
                <LogTerminal
                    content={displayedLogs}
                    terminalRef={terminalRef}
                />
                <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{
                        position: "absolute",
                        right: 18,
                        top: 18,
                    }}
                >
                    <IconButton
                        aria-label="search logs"
                        size="small"
                        sx={{ color: "#e5e7eb" }}
                    >
                        <SearchIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        aria-label="copy logs"
                        onClick={handleCopyLogs}
                        size="small"
                        sx={{ color: "#e5e7eb" }}
                    >
                        <ContentCopyOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        aria-label="download logs"
                        onClick={handleDownloadLogs}
                        size="small"
                        sx={{ color: "#e5e7eb" }}
                    >
                        <DownloadOutlinedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        </Box>
    );
};

const PodEventsView = ({ name, namespace }) => {
    const { data, error, isFetching, isLoading } = useQuery({
        enabled: Boolean(namespace && name),
        queryFn: () => fetchPodEvents(namespace, name),
        queryKey: ["podEvents", namespace, name],
    });

    if (isLoading || isFetching) {
        return (
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    minHeight: 220,
                }}
            >
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ boxShadow: "none" }}>
                {getApiErrorMessage(error, "Failed to fetch pod events")}
            </Alert>
        );
    }

    return (
        <PlainTable
            columns={[
                { key: "type", label: "Type" },
                { key: "reason", label: "Reason" },
                { key: "message", label: "Message" },
                { key: "count", label: "Count" },
                { key: "lastTimestamp", label: "Last Seen" },
            ]}
            rows={(data?.items || []).map((event) => ({
                ...event,
                lastTimestamp: formatDateTime(event.lastTimestamp),
            }))}
            emptyText="No pod events available."
        />
    );
};

const PodTerminalView = ({ pod }) => {
    const namespace = pod?.metadata?.namespace || "default";
    const name = pod?.metadata?.name || "";
    const container = pod?.spec?.containers?.[0]?.name || "main";
    const containers = (pod?.spec?.containers || []).map((item) => item.name);
    const [selectedContainer, setSelectedContainer] = React.useState(container);
    const [connected, setConnected] = React.useState(false);
    const terminalRef = React.useRef(null);
    const socketRef = React.useRef(null);
    const termRef = React.useRef(null);
    const fitAddonRef = React.useRef(null);

    React.useEffect(() => {
        let disposed = false;
        let resizeObserver;
        let dataDisposable;
        let session;
        let sessionListener;
        const sessionKey = `${namespace}/${name}/${selectedContainer}`;

        if (!terminalRef.current) {
            return undefined;
        }

        Promise.all([
            import("@xterm/xterm"),
            import("@xterm/addon-fit"),
        ]).then(([xtermModule, fitModule]) => {
            if (disposed || !terminalRef.current) {
                return;
            }

            const term = new xtermModule.Terminal({
                allowProposedApi: false,
                cursorBlink: true,
                convertEol: true,
                fontFamily:
                    '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: 12.5,
                lineHeight: 1.35,
                scrollback: 5000,
                theme: {
                    background: "#171717",
                    black: "#171717",
                    blue: "#60a5fa",
                    brightBlack: "#6b7280",
                    brightBlue: "#93c5fd",
                    brightCyan: "#67e8f9",
                    brightGreen: "#86efac",
                    brightMagenta: "#f0abfc",
                    brightRed: "#fca5a5",
                    brightWhite: "#ffffff",
                    brightYellow: "#fde68a",
                    cursor: "#e5e7eb",
                    cyan: "#22d3ee",
                    foreground: "#e5e7eb",
                    green: "#4ade80",
                    magenta: "#e879f9",
                    red: "#f87171",
                    selectionBackground: "#374151",
                    white: "#e5e7eb",
                    yellow: "#facc15",
                },
            });
            const fitAddon = new fitModule.FitAddon();
            term.loadAddon(fitAddon);
            term.open(terminalRef.current);
            fitAddon.fit();
            term.focus();

            termRef.current = term;
            fitAddonRef.current = fitAddon;
            term.writeln(
                `Connecting to ${namespace}/${name} (${selectedContainer})...`,
            );

            const protocol =
                window.location.protocol === "https:" ? "wss" : "ws";
            const url = `${protocol}://${window.location.host}${API_BASE}/pods/${encodeURIComponent(
                namespace,
            )}/${encodeURIComponent(name)}/terminal?container=${encodeURIComponent(
                selectedContainer,
            )}`;
            session = getTerminalSession(sessionKey, url);
            socketRef.current = session.socket;
            setConnected(session.connected);

            if (session.buffer.length > 0) {
                term.write(session.buffer.join(""));
            }

            sessionListener = (event) => {
                if (disposed) {
                    return;
                }

                if (event.type === "open") {
                    term.focus();
                    return;
                }

                if (event.type === "message") {
                    if (event.data.startsWith("Connected to ")) {
                        setConnected(true);
                    }
                    term.write(event.data);
                    return;
                }

                if (event.type === "close") {
                    setConnected(false);
                    const closeEvent = event.event;
                    const suffix =
                        closeEvent?.code || closeEvent?.reason
                            ? ` (${closeEvent.code || "unknown"}${
                                  closeEvent.reason
                                      ? ` ${closeEvent.reason}`
                                      : ""
                              })`
                            : "";
                    const state = event.wasConnected
                        ? "disconnected"
                        : "closed before Kubernetes exec was ready";
                    term.writeln(`\r\n[terminal ${state}${suffix}]`);
                    return;
                }

                if (event.type === "error") {
                    term.writeln("\r\n[terminal connection error]");
                }
            };

            session.listeners.add(sessionListener);

            dataDisposable = term.onData((data) => {
                if (session?.socket.readyState === WebSocket.OPEN) {
                    session.socket.send(data);
                }
            });

            resizeObserver = new ResizeObserver(() => {
                fitAddon.fit();
            });
            resizeObserver.observe(terminalRef.current);
        });

        return () => {
            disposed = true;
            session?.listeners.delete(sessionListener);
            releaseTerminalSession(sessionKey);
            dataDisposable?.dispose();
            resizeObserver?.disconnect();
            termRef.current?.dispose();
            socketRef.current = null;
            termRef.current = null;
            fitAddonRef.current = null;
            setConnected(false);
        };
    }, [name, namespace, selectedContainer]);

    return (
        <Box sx={{ display: "grid", gap: 1.5 }}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    sx={{ alignItems: { xs: "stretch", sm: "center" } }}
                >
                    <Typography sx={detailLabelSx}>Container</Typography>
                    <Select
                        onChange={(event) =>
                            setSelectedContainer(event.target.value)
                        }
                        size="small"
                        sx={{ minWidth: 180 }}
                        value={selectedContainer}
                    >
                        {(containers.length ? containers : [container]).map(
                            (item) => (
                                <MenuItem key={item} value={item}>
                                    {item}
                                </MenuItem>
                            ),
                        )}
                    </Select>
                </Stack>

                <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "center", justifyContent: "flex-end" }}
                >
                    <Typography
                        sx={{
                            color: connected ? "success.main" : "text.secondary",
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {connected ? "Connected" : "Connecting"}
                    </Typography>
                    <Button
                        onClick={() => termRef.current?.clear()}
                        variant="outlined"
                    >
                        Clear
                    </Button>
                </Stack>
            </Stack>

            <Box
                ref={terminalRef}
                sx={{
                    ...terminalSx,
                    minHeight: 620,
                    p: 1.5,
                    "& .xterm": {
                        height: "100%",
                    },
                    "& .xterm-screen": {
                        height: "100%",
                    },
                }}
            />
        </Box>
    );
};

const PodDetailsPanel = ({
    elevated = false,
    onClose,
    selectedPod,
    selectedTab,
    setSelectedTab,
}) => {
    const [selectedLogContainer, setSelectedLogContainer] = React.useState("");
    const [logTailLines, setLogTailLines] = React.useState(200);
    const [logFollow, setLogFollow] = React.useState(false);
    const namespace = selectedPod?.metadata?.namespace;
    const name = selectedPod?.metadata?.name;
    const {
        data: pod,
        error,
        isLoading,
    } = useQuery({
        enabled: Boolean(namespace && name),
        initialData: selectedPod || undefined,
        queryFn: () => fetchPod(namespace, name),
        queryKey: ["pod", namespace, name],
    });
    const containers = React.useMemo(
        () => (pod?.spec?.containers || []).map((container) => container.name),
        [pod],
    );
    const podData = pod || selectedPod;

    React.useEffect(() => {
        if (!containers.length) {
            setSelectedLogContainer("");
            return;
        }

        if (
            !selectedLogContainer ||
            !containers.includes(selectedLogContainer)
        ) {
            setSelectedLogContainer(containers[0]);
        }
    }, [containers, selectedLogContainer]);

    if (!selectedPod) {
        return (
            <Paper
                sx={{
                    border: `1px solid ${panelBorder}`,
                    borderRadius: 1.5,
                    boxShadow: "none",
                    minHeight: 680,
                    p: 3,
                }}
            >
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                    Select a pod to view details.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                bgcolor: panelBg,
                border: `1px solid ${panelBorder}`,
                borderRight: elevated ? 0 : `1px solid ${panelBorder}`,
                borderBottomLeftRadius: elevated ? 0 : 2,
                borderBottomRightRadius: 0,
                borderTopLeftRadius: elevated ? 0 : 1.5,
                borderTopRightRadius: 0,
                boxShadow: elevated
                    ? "-18px 0 36px -22px rgba(15, 23, 42, 0.45)"
                    : "0 8px 20px rgba(15, 23, 42, 0.06)",
                display: "flex",
                flexDirection: "column",
                height: elevated ? "100vh" : "auto",
                minHeight: elevated ? "100vh" : 680,
                overflow: "hidden",
                position: "relative",
                zIndex: 2,
                transition: "box-shadow 0.2s ease",
            }}
        >
            <Box
                sx={{
                    borderBottom: `1px solid ${panelBorder}`,
                    px: { xs: 1.75, md: 2.25 },
                    py: 1.1,
                }}
            >
                <Box
                    sx={{
                        alignItems: "flex-start",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 1.25,
                                minWidth: 0,
                            }}
                        >
                            <Inventory2OutlinedIcon
                                sx={{
                                    color: "text.primary",
                                    fontSize: 18,
                                }}
                            />
                            <Typography
                                sx={{
                                    color: "text.primary",
                                    fontSize: 15.5,
                                    fontWeight: 700,
                                    lineHeight: 1.35,
                                    minWidth: 0,
                                }}
                            >
                                Pod: {name}
                            </Typography>
                        </Box>
                        <Stack
                            direction="row"
                            spacing={{ xs: 1.5, md: 2.75 }}
                            sx={{
                                flexWrap: "wrap",
                                mt: 1.15,
                                rowGap: 0.65,
                            }}
                        >
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 0.6,
                                }}
                            >
                                <Typography sx={headerMetaLabelSx}>
                                    Namespace:
                                </Typography>
                                <Typography sx={headerMetaValueSx}>
                                    {podData?.metadata?.namespace || "-"}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 0.6,
                                }}
                            >
                                <Typography sx={headerMetaLabelSx}>
                                    Job:
                                </Typography>
                                <Typography sx={headerMetaValueSx}>
                                    {podJobName(podData)}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 0.6,
                                }}
                            >
                                <Typography sx={headerMetaLabelSx}>
                                    Node:
                                </Typography>
                                <Typography sx={headerMetaValueSx}>
                                    {podData?.spec?.nodeName || "-"}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    alignItems: "center",
                                    display: "flex",
                                    gap: 0.8,
                                }}
                            >
                                <Typography sx={headerMetaLabelSx}>
                                    Status:
                                </Typography>
                                <PodStatusChip status={podStatus(podData)} />
                            </Box>
                        </Stack>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Tabs
                onChange={(_, value) => setSelectedTab(value)}
                sx={{
                    borderBottom: `1px solid ${panelBorder}`,
                    minHeight: 44,
                    px: 1,
                    "& .MuiTab-root": {
                        fontSize: 13,
                        fontWeight: 500,
                        minHeight: 44,
                        px: 1.25,
                        textTransform: "none",
                    },
                }}
                value={selectedTab}
                variant="scrollable"
            >
                <Tab label="Overview" value="overview" />
                <Tab label="Logs" value="logs" />
                <Tab label="Terminal" value="terminal" />
                <Tab label="YAML" value="yaml" />
                <Tab label="Events" value="events" />
            </Tabs>

            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                {isLoading && !podData ? (
                    <Box
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "center",
                            minHeight: 220,
                        }}
                    >
                        <CircularProgress size={22} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ boxShadow: "none" }}>
                        {getApiErrorMessage(
                            error,
                            "Failed to fetch pod details",
                        )}
                    </Alert>
                ) : selectedTab === "overview" ? (
                    <PodOverview pod={pod} />
                ) : selectedTab === "yaml" ? (
                    <Box
                        sx={{
                            border: `1px solid ${panelBorder}`,
                            borderRadius: 1,
                            overflow: "hidden",
                        }}
                    >
                        <PodYamlView
                            enabled
                            name={name}
                            namespace={namespace}
                        />
                    </Box>
                ) : selectedTab === "logs" ? (
                    <PodLogsView
                        container={selectedLogContainer}
                        containers={containers}
                        follow={logFollow}
                        name={name}
                        namespace={namespace}
                        onContainerChange={setSelectedLogContainer}
                        onFollowChange={setLogFollow}
                        onTailLinesChange={setLogTailLines}
                        tailLines={logTailLines}
                    />
                ) : selectedTab === "terminal" ? (
                    <PodTerminalView pod={podData} />
                ) : selectedTab === "events" ? (
                    <PodEventsView name={name} namespace={namespace} />
                ) : (
                    <PlaceholderPanel title="Details" />
                )}
            </Box>
        </Paper>
    );
};

export default PodDetailsPanel;
