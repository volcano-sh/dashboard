import React from "react";
import { 
    Box, 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle 
} from "@mui/material";

const JobDialog = ({ 
    open, 
    handleClose, 
    selectedJobName, 
    selectedJobYaml 
}) => {
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
            <DialogTitle>Job YAML - {selectedJobName}</DialogTitle>
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
                            __html: selectedJobYaml,
                        }}
                    />
                </Box>
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
