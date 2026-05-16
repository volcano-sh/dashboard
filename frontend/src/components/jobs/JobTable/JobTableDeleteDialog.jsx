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

const JobTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    jobToDelete,
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
                {showOnlyError ? t("error") : t("delete_job")}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    t("delete_job_confirm_msg", { jobToDelete })
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

export default JobTableDeleteDialog;
