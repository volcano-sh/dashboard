import React, { useState } from "react";
import { Collapse, Switch, Input, Tag, Card, Button as AntButton, Tooltip, Space } from "antd";
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Tier, Plugin, PluginArg } from "./types";
import { Box, Typography, Grid, Paper, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

const KNOWN_PLUGINS = [
    "gang",
    "drf",
    "predicates",
    "priority",
    "conformance",
    "proportion",
    "nodeorder",
    "binpack",
];

interface PluginTierEditorProps {
    tiers: Tier[];
    onChange: (newTiers: Tier[]) => void;
}

export const PluginTierEditor: React.FC<PluginTierEditorProps> = ({
    tiers,
    onChange,
}) => {
    const { t } = useTranslation();
    const [newPluginName, setNewPluginName] = useState<Record<string, string>>({});

    const handleTierChange = (tierIndex: number, updatedTier: Tier) => {
        const newTiers = [...tiers];
        newTiers[tierIndex] = updatedTier;
        onChange(newTiers);
    };

    const handleTogglePlugin = (
        tierIndex: number,
        pluginIndex: number,
        checked: boolean,
    ) => {
        const tier = tiers[tierIndex];
        const newPlugins = [...tier.plugins];
        newPlugins[pluginIndex] = {
            ...newPlugins[pluginIndex],
            enabled: checked,
        };
        handleTierChange(tierIndex, { ...tier, plugins: newPlugins });
    };

    const handleArgChange = (
        tierIndex: number,
        pluginIndex: number,
        argIndex: number,
        field: keyof PluginArg,
        val: any,
    ) => {
        const tier = tiers[tierIndex];
        const newPlugins = [...tier.plugins];
        const newArgs = [...newPlugins[pluginIndex].arguments];

        let finalVal = val;
        if (field === "value") {
            // Infer type
            if (val === "true" || val === true) finalVal = true;
            else if (val === "false" || val === false) finalVal = false;
            else if (val !== "" && !isNaN(Number(val))) finalVal = Number(val);
        }

        newArgs[argIndex] = {
            ...newArgs[argIndex],
            [field]: finalVal,
        };
        newPlugins[pluginIndex] = {
            ...newPlugins[pluginIndex],
            arguments: newArgs,
        };
        handleTierChange(tierIndex, { ...tier, plugins: newPlugins });
    };

    const handleAddArg = (tierIndex: number, pluginIndex: number) => {
        const tier = tiers[tierIndex];
        const newPlugins = [...tier.plugins];
        const newArgs = [...newPlugins[pluginIndex].arguments, { key: "", value: "" }];
        newPlugins[pluginIndex] = {
            ...newPlugins[pluginIndex],
            arguments: newArgs,
        };
        handleTierChange(tierIndex, { ...tier, plugins: newPlugins });
    };

    const handleRemoveArg = (
        tierIndex: number,
        pluginIndex: number,
        argIndex: number,
    ) => {
        const tier = tiers[tierIndex];
        const newPlugins = [...tier.plugins];
        const newArgs = newPlugins[pluginIndex].arguments.filter(
            (_, idx) => idx !== argIndex,
        );
        newPlugins[pluginIndex] = {
            ...newPlugins[pluginIndex],
            arguments: newArgs,
        };
        handleTierChange(tierIndex, { ...tier, plugins: newPlugins });
    };

    const handleAddPlugin = (tierIndex: number, name: string) => {
        if (!name.trim()) return;
        const tier = tiers[tierIndex];
        // Check if plugin already exists in this tier
        if (tier.plugins.some((p) => p.name === name)) {
            return;
        }

        const newPlugin: Plugin = {
            name: name.trim(),
            enabled: true,
            arguments: [],
        };

        handleTierChange(tierIndex, {
            ...tier,
            plugins: [...tier.plugins, newPlugin],
        });

        // Clear input for this tier
        setNewPluginName((prev) => ({ ...prev, [tier.id]: "" }));
    };

    const handleRemovePlugin = (tierIndex: number, pluginIndex: number) => {
        const tier = tiers[tierIndex];
        const newPlugins = tier.plugins.filter((_, idx) => idx !== pluginIndex);
        handleTierChange(tierIndex, { ...tier, plugins: newPlugins });
    };

    const handleAddTier = () => {
        const newTiers = [...tiers, { id: String(Date.now()), plugins: [] }];
        onChange(newTiers);
    };

    const handleRemoveTier = (tierIndex: number) => {
        onChange(tiers.filter((_, idx) => idx !== tierIndex));
    };

    const inferType = (val: any): "bool" | "number" | "string" => {
        if (typeof val === "boolean" || val === "true" || val === "false") {
            return "bool";
        }
        if (val !== "" && !isNaN(Number(val)) && typeof val !== "boolean") {
            return "number";
        }
        return "string";
    };

    const getTypeColor = (type: "bool" | "number" | "string") => {
        switch (type) {
            case "bool":
                return "green";
            case "number":
                return "blue";
            default:
                return "orange";
        }
    };

    // Render Collapse panel items
    const collapseItems = tiers.map((tier, tierIdx) => {
        const header = (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t("tier", "Tier")} {tierIdx + 1} ({tier.plugins.length}{" "}
                    {t("plugins_count", "Plugins")})
                </Typography>
                <AntButton
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveTier(tierIdx)}
                    disabled={tiers.length <= 1}
                >
                    {t("remove_tier", "Remove Tier")}
                </AntButton>
            </Box>
        );

        const content = (
            <Box>
                <Grid container spacing={3}>
                    {tier.plugins.map((plugin, pluginIdx) => (
                        <Grid item xs={12} md={6} key={plugin.name}>
                            <Card
                                size="small"
                                title={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {plugin.name}
                                        </Typography>
                                        <Space>
                                            <Switch
                                                checked={plugin.enabled}
                                                onChange={(checked) =>
                                                    handleTogglePlugin(
                                                        tierIdx,
                                                        pluginIdx,
                                                        checked,
                                                    )
                                                }
                                                checkedChildren={t("enabled", "ON")}
                                                unCheckedChildren={t("disabled", "OFF")}
                                            />
                                            <AntButton
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() =>
                                                    handleRemovePlugin(tierIdx, pluginIdx)
                                                }
                                                size="small"
                                            />
                                        </Space>
                                    </Box>
                                }
                                style={{
                                    borderColor: plugin.enabled ? "#1976d2" : "#e0e0e0",
                                    opacity: plugin.enabled ? 1 : 0.6,
                                }}
                            >
                                {plugin.enabled ? (
                                    <Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 1 }}
                                        >
                                            {t("plugin_arguments", "Arguments:")}
                                        </Typography>
                                        {plugin.arguments.map((arg, argIdx) => {
                                            const type = inferType(arg.value);
                                            return (
                                                <Box
                                                    key={argIdx}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                        mb: 1.5,
                                                    }}
                                                >
                                                    <Input
                                                        placeholder={t("key", "Key")}
                                                        value={arg.key}
                                                        onChange={(e) =>
                                                            handleArgChange(
                                                                tierIdx,
                                                                pluginIdx,
                                                                argIdx,
                                                                "key",
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{ width: "45%" }}
                                                    />
                                                    <Input
                                                        placeholder={t("value", "Value")}
                                                        value={String(arg.value)}
                                                        onChange={(e) =>
                                                            handleArgChange(
                                                                tierIdx,
                                                                pluginIdx,
                                                                argIdx,
                                                                "value",
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{ width: "35%" }}
                                                    />
                                                    <Tooltip
                                                        title={`${t("inferred_type", "Inferred Type")}: ${type}`}
                                                    >
                                                        <Tag color={getTypeColor(type)}>
                                                            {type}
                                                        </Tag>
                                                    </Tooltip>
                                                    <AntButton
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() =>
                                                            handleRemoveArg(
                                                                tierIdx,
                                                                pluginIdx,
                                                                argIdx,
                                                            )
                                                        }
                                                    />
                                                </Box>
                                            );
                                        })}
                                        <AntButton
                                            type="dashed"
                                            block
                                            icon={<PlusOutlined />}
                                            onClick={() => handleAddArg(tierIdx, pluginIdx)}
                                            size="small"
                                        >
                                            {t("add_argument", "Add Argument")}
                                        </AntButton>
                                    </Box>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontStyle: "italic", textAlign: "center", py: 1 }}
                                    >
                                        {t("plugin_disabled", "Plugin disabled. It will not be loaded.")}
                                    </Typography>
                                )}
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Box
                    sx={{
                        mt: 3,
                        pt: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Input
                        placeholder={t("custom_plugin_name", "Plugin Name")}
                        value={newPluginName[tier.id] || ""}
                        onChange={(e) =>
                            setNewPluginName((prev) => ({
                                ...prev,
                                [tier.id]: e.target.value,
                            }))
                        }
                        style={{ width: "200px" }}
                        onPressEnter={() =>
                            handleAddPlugin(tierIdx, newPluginName[tier.id] || "")
                        }
                    />
                    <AntButton
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() =>
                            handleAddPlugin(tierIdx, newPluginName[tier.id] || "")
                        }
                    >
                        {t("add_plugin", "Add Plugin")}
                    </AntButton>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {KNOWN_PLUGINS.filter(
                            (kp) => !tier.plugins.some((p) => p.name === kp),
                        ).map((kp) => (
                            <AntButton
                                key={kp}
                                size="small"
                                type="dashed"
                                onClick={() => handleAddPlugin(tierIdx, kp)}
                            >
                                {kp}
                            </AntButton>
                        ))}
                    </Box>
                </Box>
            </Box>
        );

        return {
            key: tier.id,
            label: header,
            children: content,
        };
    });

    return (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={1}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {t("plugin_tiers", "Plugin Tiers")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t(
                    "plugin_tiers_help",
                    "Manage plugin activation and ordering in hierarchical tiers. Active plugins execute left-to-right within their tier.",
                )}
            </Typography>

            <Collapse defaultActiveKey={tiers.map((t) => t.id)} items={collapseItems} />

            <Box sx={{ mt: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<PlusOutlined style={{ fontSize: "14px" }} />}
                    onClick={handleAddTier}
                >
                    {t("add_tier", "Add Tier")}
                </Button>
            </Box>
        </Paper>
    );
};
export default PluginTierEditor;
