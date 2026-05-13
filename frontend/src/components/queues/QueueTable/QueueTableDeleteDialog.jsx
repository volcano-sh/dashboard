import React from "react";
import { useTranslation } from "react-i18next";
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

const QueueTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    queueToDelete,
    error,
}) => {
    const { t } = useTranslation();
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
                {showOnlyError ? t("common.error") : t("queues.deleteDialog.title")}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    t("queues.deleteDialog.confirmation", { name: queueToDelete })
                )}
            </DialogContent>

            <DialogActions>
                {!showOnlyError && (
                    <Button onClick={onClose} color="primary">
                        {t("common.cancel")}
                    </Button>
                )}
                {!showOnlyError && (
                    <Button
                        onClick={onConfirm}
                        color="error"
                        variant="contained"
                    >
                        {t("common.delete")}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default QueueTableDeleteDialog;
