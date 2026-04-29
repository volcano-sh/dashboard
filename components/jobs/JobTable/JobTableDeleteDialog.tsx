import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Button,
    Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type JobTableDeleteDialogProps = {
    error?: React.ReactNode;
    isDeleting?: boolean;
    jobToDelete: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    open: boolean;
};

const JobTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    jobToDelete,
    error,
}: JobTableDeleteDialogProps) => {
    const showOnlyError = Boolean(error);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {showOnlyError ? "Error" : "Delete Job"}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    `Are you sure you want to delete job "${jobToDelete}"? This action cannot be undone.`
                )}
            </DialogContent>

            <DialogActions>
                {!showOnlyError && (
                    <Button onClick={onClose} color="primary">
                        Cancel
                    </Button>
                )}
                {!showOnlyError && (
                    <Button
                        onClick={onConfirm}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default JobTableDeleteDialog;
