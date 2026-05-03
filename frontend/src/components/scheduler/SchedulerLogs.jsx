import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
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
    const [logs, setLogs] = useState(null);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const logBoxRef = useRef(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/scheduler/logs", {
                params: { component, tailLines },
            });
            setLogs(res.data.logs || "");
            setMeta({ pod: res.data.pod, namespace: res.data.namespace });
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Failed to fetch logs: " + err.message,
            );
            setLogs(null);
        } finally {
            setLoading(false);
        }
    }, [component, tailLines]);

    const highlightKeyword = (line) => {
        if (!keyword.trim()) return line;
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const parts = line.split(new RegExp(`(${escaped})`, "gi"));
        return parts.map((part, i) =>
            new RegExp(escaped, "i").test(part) ? (
                <mark key={i} style={{ backgroundColor: "#fff176", padding: 0 }}>
                    {part}
                </mark>
            ) : (
                part
            ),
        );
    };

    const filteredLines = logs
        ? logs
              .split("\n")
              .filter(
                  (line) =>
                      !keyword.trim() ||
                      line.toLowerCase().includes(keyword.toLowerCase()),
              )
        : [];

    return (
        <Box>
            {/* Controls */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Component</InputLabel>
                    <Select
                        value={component}
                        label="Component"
                        onChange={(e) => setComponent(e.target.value)}
                    >
                        {COMPONENTS.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                                {c.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tail lines</InputLabel>
                    <Select
                        value={tailLines}
                        label="Tail lines"
                        onChange={(e) => setTailLines(e.target.value)}
                    >
                        {TAIL_LINES_OPTIONS.map((n) => (
                            <MenuItem key={n} value={n}>
                                {n}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    startIcon={
                        loading ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            <RefreshIcon />
                        )
                    }
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    {logs ? "Refresh" : "Fetch Logs"}
                </Button>
            </Box>

            {/* Keyword filter */}
            {logs && (
                <TextField
                    size="small"
                    placeholder="Filter / highlight keyword…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} /> }}
                    sx={{ mb: 1.5, width: 320 }}
                />
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {meta && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    Pod: <strong>{meta.pod}</strong> &nbsp;·&nbsp; Namespace:{" "}
                    <strong>{meta.namespace}</strong> &nbsp;·&nbsp;{" "}
                    {filteredLines.length} line{filteredLines.length !== 1 ? "s" : ""}
                    {keyword && " (filtered)"}
                </Typography>
            )}

            {logs !== null && (
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
                            No lines match the filter.
                        </Typography>
                    ) : (
                        filteredLines.map((line, i) => (
                            <Box
                                key={i}
                                component="div"
                                sx={{
                                    color: line.includes("ERROR") || line.includes("FATAL")
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

            {!logs && !loading && !error && (
                <Typography color="text.secondary" variant="body2">
                    Select a component and click <strong>Fetch Logs</strong>.
                </Typography>
            )}
        </Box>
    );
};

export default SchedulerLogs;
