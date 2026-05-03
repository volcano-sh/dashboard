import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SearchIcon from "@mui/icons-material/Search";

const COMPONENTS = [
    { value: "scheduler", label: "volcano-scheduler" },
    { value: "controller-manager", label: "volcano-controller-manager" },
    { value: "webhook-manager", label: "volcano-webhook-manager" },
    { value: "agent", label: "volcano-agent" },
];

const TAIL_LINES_OPTIONS = [50, 100, 200, 500, 1000];

const SchedulerLogs = () => {
    const [component, setComponent] = useState("scheduler");
    const [tailLines, setTailLines] = useState(100);
    const [keyword, setKeyword] = useState("");
    const [lines, setLines] = useState(null);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [liveMode, setLiveMode] = useState(false);
    const [error, setError] = useState(null);

    const esRef = useRef(null);
    const logBoxRef = useRef(null);

    const stopStream = useCallback(() => {
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }
        setStreaming(false);
    }, []);

    // Snapshot fetch (no SSE)
    const fetchSnapshot = useCallback(async () => {
        stopStream();
        setLoading(true);
        setError(null);
        setLines(null);
        try {
            const res = await axios.get("/api/scheduler/logs", {
                params: { component, tailLines },
            });
            setLines((res.data.logs || "").split("\n").filter(Boolean));
            setMeta({ pod: res.data.pod, namespace: res.data.namespace });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch logs: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [component, tailLines, stopStream]);

    // SSE stream
    const startStream = useCallback(() => {
        stopStream();
        setError(null);
        setLines([]);
        setMeta(null);

        const params = new URLSearchParams({ component, tailLines, follow: "true" });
        const es = new EventSource(`/api/scheduler/logs/stream?${params}`);
        esRef.current = es;
        setStreaming(true);

        es.addEventListener("meta", (e) => {
            try { setMeta(JSON.parse(e.data)); } catch { /* ignore */ }
        });

        es.addEventListener("error", (e) => {
            try {
                const d = JSON.parse(e.data);
                setError(d.message || "Stream error");
            } catch {
                setError("Stream connection error");
            }
            stopStream();
        });

        es.addEventListener("done", () => {
            stopStream();
        });

        es.onmessage = (e) => {
            try {
                const line = JSON.parse(e.data);
                setLines((prev) => {
                    const next = [...(prev || []), line];
                    return next.length > 5000 ? next.slice(-5000) : next;
                });
            } catch { /* ignore */ }
        };

        es.onerror = () => {
            setError("SSE connection lost");
            stopStream();
        };
    }, [component, tailLines, stopStream]);

    // Auto-scroll to bottom when new lines arrive in streaming mode
    useEffect(() => {
        if (streaming && logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    }, [lines, streaming]);

    // Stop stream when component unmounts
    useEffect(() => () => stopStream(), [stopStream]);

    const handleToggleLive = (e) => {
        const enabled = e.target.checked;
        setLiveMode(enabled);
        if (!enabled) stopStream();
    };

    const handleFetch = () => {
        if (liveMode) startStream();
        else fetchSnapshot();
    };

    const highlightKeyword = (line) => {
        if (!keyword.trim()) return line;
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const parts = line.split(new RegExp(`(${escaped})`, "gi"));
        return parts.map((part, i) =>
            new RegExp(escaped, "i").test(part) ? (
                <mark key={i} style={{ backgroundColor: "#fff176", padding: 0 }}>
                    {part}
                </mark>
            ) : part,
        );
    };

    const filteredLines = (lines || []).filter(
        (line) => !keyword.trim() || line.toLowerCase().includes(keyword.toLowerCase()),
    );

    const isActive = loading || streaming;

    return (
        <Box>
            {/* Controls */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Component</InputLabel>
                    <Select
                        value={component}
                        label="Component"
                        onChange={(e) => { setComponent(e.target.value); stopStream(); }}
                        disabled={streaming}
                    >
                        {COMPONENTS.map((c) => (
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tail lines</InputLabel>
                    <Select
                        value={tailLines}
                        label="Tail lines"
                        onChange={(e) => setTailLines(e.target.value)}
                        disabled={streaming}
                    >
                        {TAIL_LINES_OPTIONS.map((n) => (
                            <MenuItem key={n} value={n}>{n}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={
                        <Switch
                            checked={liveMode}
                            onChange={handleToggleLive}
                            size="small"
                        />
                    }
                    label="Live stream"
                    sx={{ ml: 0 }}
                />

                {streaming ? (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={stopStream}
                        size="small"
                    >
                        Stop
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        startIcon={
                            loading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : liveMode ? (
                                <PlayArrowIcon />
                            ) : (
                                <RefreshIcon />
                            )
                        }
                        onClick={handleFetch}
                        disabled={loading}
                        size="small"
                    >
                        {lines ? (liveMode ? "Restart Stream" : "Refresh") : liveMode ? "Start Stream" : "Fetch Logs"}
                    </Button>
                )}
            </Box>

            {/* Keyword filter */}
            {lines && (
                <TextField
                    size="small"
                    placeholder="Filter / highlight keyword…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <SearchIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                        ),
                    }}
                    sx={{ mb: 1.5, width: 320 }}
                />
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {meta && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    Pod: <strong>{meta.pod}</strong> &nbsp;·&nbsp; Namespace:{" "}
                    <strong>{meta.namespace}</strong> &nbsp;·&nbsp;{" "}
                    {filteredLines.length} line{filteredLines.length !== 1 ? "s" : ""}
                    {keyword && " (filtered)"}
                    {streaming && (
                        <Box
                            component="span"
                            sx={{
                                ml: 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "success.main",
                            }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: "success.main",
                                    animation: "pulse 1.5s infinite",
                                    "@keyframes pulse": {
                                        "0%,100%": { opacity: 1 },
                                        "50%": { opacity: 0.3 },
                                    },
                                }}
                            />
                            live
                        </Box>
                    )}
                </Typography>
            )}

            {lines !== null && (
                <Paper
                    ref={logBoxRef}
                    variant="outlined"
                    sx={{
                        p: 1.5,
                        maxHeight: "60vh",
                        overflow: "auto",
                        backgroundColor: "#1e1e1e",
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                        lineHeight: 1.5,
                    }}
                >
                    {filteredLines.length === 0 ? (
                        <Typography color="grey.500" variant="caption">
                            {streaming ? "Waiting for log lines…" : "No lines match the filter."}
                        </Typography>
                    ) : (
                        filteredLines.map((line, i) => (
                            <Box
                                key={i}
                                component="div"
                                sx={{
                                    color:
                                        line.includes("ERROR") || line.includes("FATAL")
                                            ? "#f44336"
                                            : line.includes("WARN")
                                            ? "#ff9800"
                                            : "#d4d4d4",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                }}
                            >
                                {highlightKeyword(line)}
                            </Box>
                        ))
                    )}
                </Paper>
            )}

            {!lines && !isActive && !error && (
                <Typography color="text.secondary" variant="body2">
                    Select a component and click{" "}
                    <strong>{liveMode ? "Start Stream" : "Fetch Logs"}</strong>.
                </Typography>
            )}
        </Box>
    );
};

export default SchedulerLogs;
