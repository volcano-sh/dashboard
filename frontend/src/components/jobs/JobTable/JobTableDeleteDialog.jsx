import React from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
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

const JobTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    jobToDelete,
    error,
}) => {
    const { lang } = useLanguage();
    const zh = lang === "zh";
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
                {showOnlyError ? (zh ? "错误" : "Error") : (zh ? "删除作业" : "Delete Job")}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {showOnlyError ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    zh ? `确定要删除作业 "${jobToDelete}"？此操作不可撤销。` : `Are you sure you want to delete job "${jobToDelete}"? This action cannot be undone.`
                )}
            </DialogContent>

            <DialogActions>
                {!showOnlyError && (
                    <Button onClick={onClose} color="primary">
                        {zh ? "取消" : "Cancel"}
                    </Button>
                )}
                {!showOnlyError && (
                    <Button
                        onClick={onConfirm}
                        color="error"
                        variant="contained"
                    >
                        {zh ? "删除" : "Delete"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default JobTableDeleteDialog;
