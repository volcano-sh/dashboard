import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    CircularProgress,
    Typography,
    FormControl,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useCluster } from "../../config/ClusterContext";

const LogViewer = ({ namespace, podName, containers }) => {
    const { currentCluster } = useCluster();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState(
        containers[0]?.name || "",
    );
    const scrollRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const fetchLogs = async () => {
        if (!selectedContainer) return;
        setLoading(true);
        setLogs([]);
        try {
            const response = await fetch(
                `/api/pods/${namespace}/${podName}/logs?container=${selectedContainer}&tailLines=500&follow=false`,
                {
                    headers: { "X-Cluster-Context": currentCluster },
                },
            );
            if (response.ok) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    setLogs((prev) => [...prev, chunk]);
                }
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLogs(["Error fetching logs: " + error.message]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [namespace, podName, selectedContainer, currentCluster]);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "500px",
                bgcolor: "#1e1e1e",
                borderRadius: 1,
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    bgcolor: "#333",
                    color: "white",
                }}
            >
                <Typography variant="body2" sx={{ mr: 2 }}>
                    Container:
                </Typography>
                <Select
                    size="small"
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    sx={{
                        color: "white",
                        ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "gray",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "white",
                        },
                        height: "30px",
                    }}
                >
                    {containers.map((c) => (
                        <MenuItem key={c.name} value={c.name}>
                            {c.name}
                        </MenuItem>
                    ))}
                </Select>
                <Box sx={{ ml: "auto" }}>
                    <Tooltip title="Refresh Logs">
                        <IconButton
                            size="small"
                            onClick={fetchLogs}
                            sx={{ color: "white" }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Toggle Auto-scroll">
                        <IconButton
                            size="small"
                            onClick={() => setAutoScroll(!autoScroll)}
                            sx={{
                                color: autoScroll ? "#4caf50" : "white",
                            }}
                        >
                            <FileDownloadIcon
                                sx={{
                                    transform: autoScroll
                                        ? "none"
                                        : "rotate(180deg)",
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box
                ref={scrollRef}
                sx={{
                    flexGrow: 1,
                    p: 1,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    whiteSpace: "pre-wrap",
                    color: "#d4d4d4",
                }}
            >
                {loading && logs.length === 0 ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    logs.join("")
                )}
                {logs.length === 0 && !loading && (
                    <Typography
                        variant="body2"
                        sx={{ color: "gray", textAlign: "center", mt: 4 }}
                    >
                        No logs available for this container.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default LogViewer;
