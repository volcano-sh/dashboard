import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useCluster } from "../../config/ClusterContext";

const TerminalViewer = ({ namespace, podName, containers }) => {
    const { currentCluster } = useCluster();
    const terminalRef = useRef(null);
    const [selectedContainer, setSelectedContainer] = useState(
        containers[0]?.name || "",
    );
    const xtermRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!terminalRef.current || !selectedContainer) return;

        // Initialize xterm
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: "#1e1e1e",
            },
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        xtermRef.current = term;

        // Setup WebSocket
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host; // This might be Vite proxy, so we need to be careful
        // In dev, Vite proxies /api, but websockets might need direct access or Vite setup
        const wsUrl = `${protocol}//${host}/api/v1/terminal?context=${currentCluster}&namespace=${namespace}&pod=${podName}&container=${selectedContainer}`;
        
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            term.write("\r\n*** Connected to container terminal ***\r\n");
        };

        ws.onmessage = (event) => {
            term.write(event.data);
        };

        ws.onclose = () => {
            term.write("\r\n*** Connection closed ***\r\n");
        };

        ws.onerror = (error) => {
            term.write("\r\n*** Connection error ***\r\n");
            console.error("WebSocket error:", error);
        };

        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        const handleResize = () => {
            fitAddon.fit();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            term.dispose();
            ws.close();
        };
    }, [namespace, podName, selectedContainer, currentCluster]);

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
            </Box>
            <Box
                ref={terminalRef}
                sx={{
                    flexGrow: 1,
                    p: 1,
                    "& .xterm-viewport": {
                        overflowY: "auto !important",
                    },
                }}
            />
        </Box>
    );
};

export default TerminalViewer;
