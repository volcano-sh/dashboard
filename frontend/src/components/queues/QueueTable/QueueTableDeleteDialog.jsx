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
import { useTranslation } from "react-i18next";

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
                {showOnlyError ? t("error") : t("delete_queue")}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    t("delete_queue_confirm_msg", { queueToDelete })
                )}
            </DialogContent>

            <DialogActions>
                {!showOnlyError && (
                    <Button onClick={onClose} color="primary">
                        {t("cancel")}
                    </Button>
                )}
                {!showOnlyError && (
                    <Button
                        onClick={onConfirm}
                        color="error"
                        variant="contained"
                    >
                        {t("delete")}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default QueueTableDeleteDialog;
