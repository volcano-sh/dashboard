import React, { useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tabs,
    Tab,
} from "@mui/material";
import LogViewer from "./LogViewer";
import TerminalViewer from "./TerminalViewer";
import yaml from "js-yaml";

const PodDetailsDialog = ({ open, podName, namespace, containers, podYaml, onClose }) => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    let podData = null;
    try {
        // Strip HTML if necessary or just parse the original if available
        // podYaml is currently HTML formatted in Pods.jsx
        // For now, we'll try to find the containers list
    } catch (e) {}

    // We'll need the pod object to get containers properly.
    // Assuming we can extract them or Pods.jsx passes them.
    // For now, let's assume containers are extracted from the YAML or passed.

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: "90vh",
                },
            }}
        >
            <DialogTitle sx={{ pb: 0 }}>Pod Details - {podName}</DialogTitle>
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="YAML" />
                    <Tab label="Logs" />
                    <Tab label="Terminal" />
                </Tabs>
            </Box>
            <DialogContent>
                {tabValue === 0 && (
                    <Box
                        sx={{
                            mt: 2,
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            bgcolor: "#f5f5f5",
                            p: 2,
                            borderRadius: 1,
                            "& .yaml-key": {
                                fontWeight: 700,
                                color: "#000",
                            },
                        }}
                    >
                        <pre
                            dangerouslySetInnerHTML={{
                                __html: podYaml,
                            }}
                        />
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <LogViewer
                            namespace={namespace}
                            podName={podName}
                            containers={containers || []}
                        />
                    </Box>
                )}
                {tabValue === 2 && (
                    <Box sx={{ mt: 2 }}>
                        <TerminalViewer
                            namespace={namespace}
                            podName={podName}
                            containers={containers || []}
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PodDetailsDialog;
