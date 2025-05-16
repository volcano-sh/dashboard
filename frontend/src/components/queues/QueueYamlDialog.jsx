import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
} from "@mui/material";

const QueueYamlDialog = ({
    openDialog,
    handleCloseDialog,
    selectedQueueName,
    selectedQueueYaml,
    onEditClick, // New prop for edit functionality
}) => {
    return (
        <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
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
            <DialogTitle>Queue YAML - {selectedQueueName}</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        mt: 2,
                        mb: 2,
                        fontFamily: "monospace",
                        fontSize: "1.2rem",
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
                            __html: selectedQueueYaml,
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between", // Changed from flex-end to space-between
                        mt: 2,
                        width: "100%",
                        px: 2,
                        pb: 2,
                    }}
                >
                    {/* New Edit button */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onEditClick}
                        sx={{
                            minWidth: "100px",
                            "&:hover": {
                                bgcolor: "primary.dark",
                            },
                        }}
                    >
                        Edit Queue
                    </Button>
                    
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCloseDialog}
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

export default QueueYamlDialog;