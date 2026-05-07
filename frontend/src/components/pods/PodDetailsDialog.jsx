import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, CircularProgress } from "@mui/material";

const PodDetailsDialog = ({
    open,
    podName,
    podYaml,
    podLogs,
    onClose,
    isLoadingLogs,
    onLoadLogs,
}) => {
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (open) {
            setTabValue(0);
        }
    }, [open]);

    const handleTabChange = (_, newValue) => {
        setTabValue(newValue);
        if (newValue === 1 && !podLogs && onLoadLogs) {
            onLoadLogs();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    width: "80%",
                    maxWidth: "800px",
                    maxHeight: "90vh",
                    m: 2,
                    bgcolor: "background.paper",
                },
            }}
        >
            <DialogTitle>Pod Details - {podName}</DialogTitle>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="YAML" />
                    <Tab label="Logs" />
                </Tabs>
            </Box>
            <DialogContent>
                {tabValue === 0 && (
                    <Box
                        sx={{
                            mt: 2,
                            mb: 2,
                            fontFamily: "monospace",
                            fontSize: "1rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 180px)",
                            bgcolor: "grey.50",
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
                    <Box
                        sx={{
                            mt: 2,
                            mb: 2,
                            fontFamily: "monospace",
                            fontSize: "1rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 180px)",
                            bgcolor: "grey.50",
                            p: 2,
                            borderRadius: 1,
                        }}
                    >
                        {isLoadingLogs ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <pre>{podLogs || "No logs available"}</pre>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", px: 2, pb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onClose}
                        sx={{ minWidth: "100px" }}
                    >
                        Close
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default PodDetailsDialog;
