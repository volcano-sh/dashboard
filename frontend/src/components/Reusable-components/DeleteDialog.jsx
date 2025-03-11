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

/**
 * DeleteDialog
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onClose - Handler to close the dialog
 * @param {function} onConfirm - Handler to confirm deletion
 * @param {string} entityType - Type of entity ("Pod", "Queue", "Job", etc.)
 * @param {string|object} entityToDelete - Entity object or string (should have metadata.name, metadata.namespace, etc.)
 * @param {function} getDisplayName - Function that takes entityToDelete and returns a string for display (optional)
 * @param {string} error - Error message, if any
 */
const DeleteDialog = ({
    open,
    onClose,
    onConfirm,
    entityType = "Item",
    entityToDelete,
    getDisplayName,
    error,
}) => {
    const showOnlyError = Boolean(error);

    // Smart default display function
    const defaultDisplayName = (item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (item.metadata && item.metadata.name && item.metadata.namespace)
            return `${item.metadata.namespace}/${item.metadata.name}`;
        if (item.metadata && item.metadata.name) return item.metadata.name;
        if (item.name) return item.name;
        return String(item);
    };

    const displayName = getDisplayName
        ? getDisplayName(entityToDelete)
        : defaultDisplayName(entityToDelete);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {showOnlyError ? "Error" : `Delete ${entityType}`}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <>
                        Are you sure you want to delete{" "}
                        {entityType.toLowerCase()} <b>{displayName}</b>? This
                        action cannot be undone.
                    </>
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

export default DeleteDialog;
