import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
<<<<<<< HEAD
    DialogActions,
    IconButton,
    Button,
    Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
=======
    DialogContentText,
    DialogActions,
    Button,
    useTheme,
    alpha,
} from "@mui/material";
>>>>>>> main

const QueueTableDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    queueToDelete,
<<<<<<< HEAD
    error,
}) => {
    const showOnlyError = Boolean(error);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            ></DialogTitle>

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
=======
}) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: "16px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
                    backdropFilter: "blur(10px)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    color: theme.palette.error.main,
                    fontSize: "1.2rem",
                    textAlign: "center",
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    padding: "24px 32px",
                }}
            >
                Confirm Deletion
            </DialogTitle>
            <DialogContent sx={{ padding: "24px 32px" }}>
                <DialogContentText
                    sx={{
                        textAlign: "center",
                        marginBottom: "24px",
                        color: theme.palette.text.primary,
                        fontSize: "1rem",
                    }}
                >
                    Are you sure you want to delete queue "{queueToDelete}"?
                    This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "0 32px 24px",
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    sx={{
                        textTransform: "none",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        padding: "8px 24px",
                        borderRadius: "8px",
                        border: `1px solid ${theme.palette.error.main}`,
                        color: theme.palette.error.main,
                        "&:hover": {
                            backgroundColor: alpha(
                                theme.palette.error.main,
                                0.08,
                            ),
                            borderColor: theme.palette.error.dark,
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    sx={{
                        textTransform: "none",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        padding: "8px 24px",
                        marginLeft: "16px",
                        borderRadius: "8px",
                        backgroundColor: theme.palette.error.main,
                        "&:hover": {
                            backgroundColor: theme.palette.error.dark,
                        },
                    }}
                >
                    Delete
                </Button>
>>>>>>> main
            </DialogActions>
        </Dialog>
    );
};

export default QueueTableDeleteDialog;
