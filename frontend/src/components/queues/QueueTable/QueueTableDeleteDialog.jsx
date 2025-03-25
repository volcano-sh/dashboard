import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    useTheme,
    alpha,
    Typography,
} from "@mui/material";

const QueueTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    queueToDelete,
    error,
}) => {
    const theme = useTheme();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Delete Queue</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete queue "{queueToDelete}"?
                    This action cannot be undone.
                </DialogContentText>
                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QueueTableDeleteDialog;
