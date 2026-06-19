import React, { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import { useTranslation } from "react-i18next";

import { SchedulerConfig } from "./types";
import { parseConf, serialiseConf } from "./yamlUtils";
import { ActionPipelineEditor } from "./ActionPipelineEditor";
import { PluginTierEditor } from "./PluginTierEditor";
import { YamlPreview } from "./YamlPreview";
import TitleComponent from "../../components/Titlecomponent";

export const ConfigPage: React.FC = () => {
    const { t } = useTranslation();
    const [savedYaml, setSavedYaml] = useState<string>("");
    const [config, setConfig] = useState<SchedulerConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/v1/config");
            const yamlStr = response.data.conf || "";
            setSavedYaml(yamlStr);
            setConfig(parseConf(yamlStr));
        } catch (err: any) {
            console.error("Error loading volcano config:", err);
            setError(
                err.response?.data?.details ||
                    err.message ||
                    t("failed_load_config", "Failed to load volcano scheduler configuration."),
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={fetchConfig}>
                        {t("retry", "Retry")}
                    </Button>
                }>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!config) return null;

    const currentYaml = serialiseConf(config);
    const hasChanges = currentYaml.trim() !== savedYaml.trim();

    const handleSave = async () => {
        if (!hasChanges) return;
        setSaving(true);
        try {
            await axios.patch("/api/v1/config", { conf: currentYaml }, {
                headers: {
                    "Content-Type": "application/merge-patch+json",
                },
            });
            setSavedYaml(currentYaml);
            alert(t("config_saved_success", "Scheduler configuration saved successfully!"));
        } catch (err: any) {
            console.error("Error saving config:", err);
            alert(
                t("config_save_error", "Failed to save configuration: ") +
                    (err.response?.data?.details || err.message),
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (window.confirm(t("discard_confirm", "Are you sure you want to discard all unsaved changes?"))) {
            setConfig(parseConf(savedYaml));
        }
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", p: 3 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <TitleComponent text={t("scheduler_config", "Volcano Scheduler Configuration")} />
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<RefreshIcon />}
                        onClick={handleDiscard}
                        disabled={!hasChanges || saving}
                    >
                        {t("discard", "Discard Changes")}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={
                            saving ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <SaveIcon />
                            )
                        }
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                    >
                        {saving ? t("saving", "Saving...") : t("save", "Save Changes")}
                    </Button>
                </Box>
            </Box>

            <ActionPipelineEditor
                actions={config.actions}
                onChange={(newActions) => setConfig({ ...config, actions: newActions })}
            />

            <PluginTierEditor
                tiers={config.tiers}
                onChange={(newTiers) => setConfig({ ...config, tiers: newTiers })}
            />

            <YamlPreview
                currentYaml={currentYaml}
                savedYaml={savedYaml}
                hasChanges={hasChanges}
            />
        </Box>
    );
};

export default ConfigPage;
