import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";

const SchedulerConfig = () => {
    const [configData, setConfigData] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const CONFIG_KEY = "volcano-scheduler.conf";

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/scheduler/config");
            setConfigData(res.data);
            setEditValue(res.data.data?.[CONFIG_KEY] || "");
        } catch (err) {
            setError("Failed to load scheduler configuration: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.patch("/api/scheduler/config", {
                data: { [CONFIG_KEY]: editValue },
            });
            setSnackbar({ open: true, message: "Configuration saved successfully", severity: "success" });
            await fetchConfig();
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Failed to save: " + (err.response?.data?.details || err.message),
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const isDirty = configData && editValue !== (configData.data?.[CONFIG_KEY] || "");

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" action={
                <Button color="inherit" size="small" onClick={fetchConfig}>
                    Retry
                </Button>
            }>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                    <Typography variant="body2" color="text.secondary">
                        ConfigMap: <strong>{configData?.name}</strong> &nbsp;·&nbsp; Namespace:{" "}
                        <strong>{configData?.namespace}</strong>
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={fetchConfig}
                        disabled={loading || saving}
                    >
                        Refresh
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                    >
                        Save
                    </Button>
                </Box>
            </Box>

            <TextField
                fullWidth
                multiline
                minRows={20}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                variant="outlined"
                inputProps={{
                    style: {
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        lineHeight: 1.6,
                    },
                }}
                placeholder="volcano-scheduler.conf YAML content..."
            />

            {isDirty && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: "block" }}>
                    Unsaved changes
                </Typography>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SchedulerConfig;
