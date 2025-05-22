import React, { useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Stack,
} from "@mui/material";

const JobDialog = ({ open, handleClose, selectedJobName, selectedJobYaml }) => {
    const [viewMode, setViewMode] = useState("yaml");

    const handleViewChange = (_, newView) => {
        if (newView !== null) {
            setViewMode(newView);
        }
    };

    // Dummy summary info (replace these with real props/data)
    const summary = {
        name: selectedJobName,
        namespace: "default", // You can pass actual namespace as prop later
        queue: "default-queue",
        status: "Pending",
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
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
            <DialogTitle>
                Job Details - {selectedJobName}
                <Box sx={{ float: "right" }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                        aria-label="View Mode"
                    >
                        <ToggleButton value="summary">Summary</ToggleButton>
                        <ToggleButton value="yaml">YAML</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </DialogTitle>

            <DialogContent>
                {viewMode === "yaml" ? (
                    <Box
                        sx={{
                            mt: 2,
                            fontFamily: "monospace",
                            fontSize: "1rem",
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 150px)",
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
                                __html: selectedJobYaml,
                            }}
                        />
                    </Box>
                ) : (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        <Typography>
                            <strong>Name:</strong> {summary.name}
                        </Typography>
                        <Typography>
                            <strong>Namespace:</strong> {summary.namespace}
                        </Typography>
                        <Typography>
                            <strong>Queue:</strong> {summary.queue}
                        </Typography>
                        <Typography>
                            <strong>Status:</strong> {summary.status}
                        </Typography>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 2,
                        width: "100%",
                        px: 2,
                        pb: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleClose}
                        sx={{
                            minWidth: "100px",
                            "&:hover": {
                                bgcolor: "primary.dark",
                            },
                        }}
                    >
                        Close
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default JobDialog;

