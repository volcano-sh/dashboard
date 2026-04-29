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

type QueueTableDeleteDialogProps = {
    error?: React.ReactNode;
    isDeleting?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    open: boolean;
    queueToDelete: React.ReactNode;
};

const QueueTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    queueToDelete,
    error,
}: QueueTableDeleteDialogProps) => {
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
                {showOnlyError ? "Error" : "Delete Queue"}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    `Are you sure you want to delete queue "${queueToDelete}"? This action cannot be undone.`
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

export default QueueTableDeleteDialog;
