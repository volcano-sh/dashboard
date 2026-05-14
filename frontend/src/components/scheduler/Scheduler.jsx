import React, { useState, useContext, useEffect, useRef } from "react";
import { Box, Tab, Tabs, Typography, Paper, Button, Stack } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import TerminalIcon from "@mui/icons-material/Terminal";
import SaveIcon from "@mui/icons-material/Save";
import Editor from "@monaco-editor/react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

import TitleComponent from "../Titlecomponent";
import translations from "./translations";
import { LanguageContext } from "../../contexts/LanguageContext";

/**
 * Scheduler management section — upgraded foundation for LFX Mentorship #197.
 * Features:
 * - Monaco Editor for structured YAML configuration.
 * - xterm.js for interactive, real-time log exploration.
 * - Premium placeholders for observability metrics.
 */
const Scheduler = () => {
    const [tabValue, setTabValue] = useState(0);
    const { lang } = useContext(LanguageContext);
    const t = translations[lang].scheduler;
    
    const terminalRef = useRef(null);
    const xtermInstance = useRef(null);
    const fitAddon = useRef(new FitAddon());

    const [configYaml, setConfigYaml] = useState(`actions: "enqueue, allocate, backfill"
tiers:
- plugins:
  - name: priority
  - name: gang
    enablePreemptable: false
  - name: conformance
- plugins:
  - name: overcommit
  - name: drf
    enablePreemptable: false
  - name: predicates
  - name: proportion
  - name: nodeorder
  - name: binpack`);

    // Initialize xterm.js
    useEffect(() => {
        if (tabValue === 2 && terminalRef.current && !xtermInstance.current) {
            const term = new Terminal({
                cursorBlink: true,
                fontSize: 13,
                fontFamily: 'monospace',
                theme: {
                    background: '#1e1e1e',
                },
            });

            term.loadAddon(fitAddon.current);
            term.open(terminalRef.current);
            fitAddon.current.fit();

            term.writeln("\x1b[32m// Initializing real-time log stream from volcano-scheduler...\x1b[0m");
            term.writeln("\x1b[34m[INFO]\x1b[0m 2026-05-14 12:54:11 - Successfully loaded configuration from volcano-system/volcano-scheduler-configmap");
            term.writeln("\x1b[34m[INFO]\x1b[0m 2026-05-14 12:54:12 - Started Prometheus metrics server on :8080");
            term.writeln("\x1b[33m[DEBUG]\x1b[0m 2026-05-14 12:54:15 - Action \"enqueue\" starting for job \"default/training-job-1\"");
            term.writeln("\x1b[34m[INFO]\x1b[0m 2026-05-14 12:54:16 - Successfully scheduled 4 pods for Job \"default/training-job-1\" in Queue \"default\"");
            term.write("\r\n\x1b[1;37m$\x1b[0m ");

            xtermInstance.current = term;
        }

        // Handle resize
        const handleResize = () => {
            if (fitAddon.current) {
                fitAddon.current.fit();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (xtermInstance.current) {
                xtermInstance.current.dispose();
                xtermInstance.current = null;
            }
        };
    }, [tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const tabConfig = [
        {
            id: "config",
            label: t.config,
            icon: <SettingsIcon sx={{ fontSize: 20 }} />,
            description: t.configDesc,
        },
        {
            id: "metrics",
            label: t.metrics,
            icon: <BarChartIcon sx={{ fontSize: 20 }} />,
            description: t.metricsDesc,
        },
        {
            id: "logs",
            label: t.logs,
            icon: <TerminalIcon sx={{ fontSize: 20 }} />,
            description: t.logsDesc,
        },
    ];

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            <TitleComponent text={t.title} />
            <Box sx={{ mt: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                    }}
                >
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="secondary"
                        textColor="inherit"
                        sx={{
                            bgcolor: "rgba(0, 0, 0, 0.02)",
                            borderBottom: 1,
                            borderColor: "divider",
                            "& .MuiTabs-indicator": {
                                backgroundColor: "primary.main",
                            },
                            "& .MuiTab-root": {
                                py: 1.5,
                                minHeight: 48,
                                textTransform: "none",
                                "&.Mui-selected": {
                                    color: "primary.main",
                                    fontWeight: 600,
                                },
                            },
                        }}
                    >
                        {tabConfig.map((tab) => (
                            <Tab
                                key={tab.id}
                                icon={tab.icon}
                                iconPosition="start"
                                label={tab.label}
                            />
                        ))}
                    </Tabs>

                    <Box sx={{ p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {tabConfig[tabValue].label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
                                    {tabConfig[tabValue].description}
                                </Typography>
                            </Box>
                            {tabValue === 0 && (
                                <Button 
                                    variant="contained" 
                                    startIcon={<SaveIcon />}
                                    sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                >
                                    {t.saveConfig}
                                </Button>
                            )}
                        </Stack>

                        {/* Tab Content Areas */}
                        {tabValue === 0 && (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                <Editor
                                    height="400px"
                                    defaultLanguage="yaml"
                                    value={configYaml}
                                    onChange={(value) => setConfigYaml(value)}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                    }}
                                />
                            </Box>
                        )}

                        {tabValue === 1 && (
                            <Box
                                sx={{
                                    height: 400,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px dashed",
                                    borderColor: "divider",
                                    borderRadius: 2,
                                    bgcolor: "#fafafa",
                                    color: "text.disabled",
                                }}
                            >
                                <BarChartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                                <Typography variant="body2">{t.placeholder}</Typography>
                                <Typography variant="caption">Charts will be integrated using react-chartjs-2.</Typography>
                            </Box>
                        )}

                        {tabValue === 2 && (
                            <Box
                                ref={terminalRef}
                                sx={{
                                    height: 400,
                                    bgcolor: "#1e1e1e",
                                    borderRadius: 2,
                                    p: 1,
                                    border: '1px solid #333',
                                    "& .xterm-viewport": {
                                        borderRadius: 2,
                                    }
                                }}
                            />
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default Scheduler;
