import React, { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Divider,
    LinearProgress,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useQuery } from "@tanstack/react-query";
import { fetchSchedulerConfig } from "../../lib/client/dashboard-api";

const tabs = ["Scheduler Configuration", "Policies", "Plugins", "Preemption"];

const tableSx = {
    "& .MuiTableCell-root": {
        borderColor: "#e6e8eb",
        fontSize: 13,
        py: 0.8,
    },
    "& .MuiTableHead-root .MuiTableCell-root": {
        bgcolor: "#f7f7f7",
        color: "#2d3136",
        fontWeight: 700,
    },
};

const valueOrDash = (value) => {
    if (value === undefined || value === null || value === "") return "-";
    if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
};

const KeyValueBlock = ({ title, description, rows }) => (
    <Box
        sx={{
            border: "1px solid #e1e4e8",
            borderRadius: 1,
            p: 2,
        }}
    >
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{title}</Typography>
        {description && (
            <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75 }}>
                {description}
            </Typography>
        )}
        <TableContainer sx={{ border: "1px solid #e6e8eb", borderRadius: 1 }}>
            <Table size="small" sx={tableSx}>
                <TableBody>
                    {rows.map(([label, value]) => (
                        <TableRow key={label}>
                            <TableCell
                                sx={{ width: "42%", color: "text.secondary" }}
                            >
                                {label}
                            </TableCell>
                            <TableCell>{valueOrDash(value)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

const SectionGrid = ({ sections }) => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
    >
        {sections.map((section) => (
            <KeyValueBlock key={section.title} {...section} />
        ))}
    </Box>
);

const EmptyState = ({ children }) => (
    <Box
        sx={{
            border: "1px dashed #cfd5dd",
            borderRadius: 1,
            color: "text.secondary",
            fontSize: 13,
            p: 2,
        }}
    >
        {children}
    </Box>
);

const SchedulerPanel = ({ config }) => {
    const actions = config?.scheduler?.actions || [];
    const sections = [
        {
            title: "Scheduler Profile",
            description: "Scheduler identity and ConfigMap source.",
            rows: [
                ["Scheduler Name", config?.scheduler?.name],
                ["ConfigMap", config?.target?.name],
                ["Namespace", config?.target?.namespace],
                ["Key", config?.target?.key],
            ],
        },
        {
            title: "Default Actions",
            description: "Actions executed in each scheduling cycle.",
            rows: actions.length
                ? actions.map((action, index) => [String(index + 1), action])
                : [["Actions", "-"]],
        },
        {
            title: "Runtime Options",
            description: "Top-level scheduler policy fields parsed from YAML.",
            rows: [
                ["Queue Ordering", config?.policies?.queueOrder],
                ["Job Order", config?.policies?.jobOrder],
                ["Resource Order", config?.policies?.resourceOrder],
                ["Node Order", config?.policies?.nodeOrder],
            ],
        },
    ];

    return (
        <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                Scheduler Configuration
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
                Live Volcano scheduler configuration parsed from Kubernetes
                ConfigMap.
            </Typography>
            <SectionGrid sections={sections} />
            <Box
                sx={{
                    border: "1px solid #e1e4e8",
                    borderRadius: 1,
                    mt: 2,
                    p: 2,
                }}
            >
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1 }}>
                    Scheduling Flow
                </Typography>
                {actions.length ? (
                    <Box
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.5,
                        }}
                    >
                        {actions.map((action, index) => (
                            <React.Fragment key={action}>
                                <Box
                                    sx={{
                                        bgcolor: "#fafafa",
                                        border: "1px solid #e6e8eb",
                                        borderRadius: 1,
                                        minWidth: 140,
                                        p: 2,
                                        textAlign: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{ fontSize: 14, fontWeight: 700 }}
                                    >
                                        {action}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontSize: 12 }}
                                    >
                                        Step {index + 1}
                                    </Typography>
                                </Box>
                                {index < actions.length - 1 && (
                                    <ArrowForwardIcon
                                        sx={{ color: "text.secondary" }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </Box>
                ) : (
                    <EmptyState>No scheduler actions found.</EmptyState>
                )}
            </Box>
        </Box>
    );
};

const PoliciesPanel = ({ config }) => {
    const policies = config?.policies || {};
    const sections = [
        {
            title: "Queue Strategy",
            rows: [["Queue Ordering", policies.queueOrder]],
        },
        {
            title: "Job Order",
            rows: [["Job Order", policies.jobOrder]],
        },
        {
            title: "Resource Sort Policy",
            rows: [["Resource Order", policies.resourceOrder]],
        },
        {
            title: "Node Sort Policy",
            rows: [["Node Order", policies.nodeOrder]],
        },
        {
            title: "Backfill Policy",
            rows: [["Backfill", policies.backfill]],
        },
        {
            title: "Reclaim Policy",
            rows: [["Reclaim", policies.reclaim]],
        },
    ];

    return (
        <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
                Policies
            </Typography>
            <SectionGrid sections={sections} />
        </Box>
    );
};

const PluginsPanel = ({ config }) => {
    const plugins = config?.plugins || [];
    const tiers = Object.entries(
        plugins.reduce((grouped, plugin) => {
            const tier = plugin.tier || "default";
            return {
                ...grouped,
                [tier]: [...(grouped[tier] || []), plugin],
            };
        }, {}),
    );

    return (
        <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                Plugins Configuration
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12, mb: 2 }}>
                Live plugin tiers parsed from the scheduler ConfigMap.
            </Typography>
            {tiers.length ? (
                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(3, 1fr)",
                        },
                        mb: 3,
                    }}
                >
                    {tiers.map(([tier, tierPlugins]) => (
                        <Box
                            key={tier}
                            sx={{
                                border: "1px solid #e1e4e8",
                                borderRadius: 1,
                                minHeight: 150,
                                p: 1.5,
                            }}
                        >
                            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                                {tier}
                            </Typography>
                            <Box
                                sx={{
                                    border: "1px solid #e6e8eb",
                                    borderRadius: 1,
                                    mt: 1,
                                }}
                            >
                                {tierPlugins.map((plugin) => (
                                    <Box
                                        key={plugin.name}
                                        sx={{
                                            borderBottom:
                                                plugin ===
                                                tierPlugins[
                                                    tierPlugins.length - 1
                                                ]
                                                    ? "none"
                                                    : "1px solid #e6e8eb",
                                            p: 1,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {plugin.name}
                                        </Typography>
                                        <Typography
                                            color="text.secondary"
                                            sx={{ fontSize: 12 }}
                                        >
                                            {plugin.enabled
                                                ? "Enabled"
                                                : "Disabled"}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : (
                <EmptyState>
                    No plugins found in scheduler ConfigMap.
                </EmptyState>
            )}
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1 }}>
                Plugin Details
            </Typography>
            <TableContainer
                sx={{ border: "1px solid #e1e4e8", borderRadius: 1 }}
            >
                <Table size="small" sx={tableSx}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Plugin Name</TableCell>
                            <TableCell>Tier</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Arguments</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {plugins.length ? (
                            plugins.map((plugin) => (
                                <TableRow key={`${plugin.tier}-${plugin.name}`}>
                                    <TableCell>{plugin.name}</TableCell>
                                    <TableCell>{plugin.tier || "-"}</TableCell>
                                    <TableCell>
                                        {plugin.enabled
                                            ? "Enabled"
                                            : "Disabled"}
                                    </TableCell>
                                    <TableCell>
                                        {valueOrDash(plugin.arguments)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    No plugin details available.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

const PreemptionPanel = ({ config }) => {
    const preemption = config?.preemption || {};
    return (
        <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
                Preemption Configuration
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
                Live preemption-related scheduler options parsed from ConfigMap.
            </Typography>
            <SectionGrid
                sections={[
                    {
                        title: "Preemption",
                        rows: [
                            ["Preemption", preemption.enabled],
                            [
                                "Victim Selection Policy",
                                preemption.victimSelection,
                            ],
                        ],
                    },
                    {
                        title: "Raw Preemption Config",
                        rows: [["Config", preemption.raw]],
                    },
                ]}
            />
            <Box
                sx={{
                    border: "1px solid #e1e4e8",
                    borderRadius: 1,
                    mt: 2,
                    p: 1.5,
                }}
            >
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                    Raw Scheduler YAML
                </Typography>
                <Box
                    component="pre"
                    sx={{
                        bgcolor: "#f7f8fa",
                        border: "1px solid #e6e8eb",
                        borderRadius: 1,
                        fontSize: 12,
                        maxHeight: 260,
                        overflow: "auto",
                        p: 1.5,
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {config?.rawYaml || "No raw YAML available."}
                </Box>
            </Box>
        </Box>
    );
};

const Configuration = () => {
    const [activeTab, setActiveTab] = useState(0);
    const {
        data: config,
        error,
        isFetching,
        isLoading,
    } = useQuery({
        queryKey: ["scheduler", "config"],
        queryFn: fetchSchedulerConfig,
    });
    const loading = isLoading || isFetching;
    const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

    const tabContent = useMemo(
        () => [
            <SchedulerPanel config={config} key="scheduler" />,
            <PoliciesPanel config={config} key="policies" />,
            <PluginsPanel config={config} key="plugins" />,
            <PreemptionPanel config={config} key="preemption" />,
        ],
        [config],
    );

    return (
        <Box
            sx={{ bgcolor: "#f7f8fa", minHeight: "calc(100vh - 64px)", p: 0.5 }}
        >
            <Card
                sx={{
                    border: "1px solid #dfe3e8",
                    borderRadius: 1,
                    boxShadow: "none",
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        component="h1"
                        sx={{ fontSize: 22, fontWeight: 700, mb: 1.5 }}
                    >
                        Configuration
                    </Typography>
                    <Tabs
                        value={activeTab}
                        onChange={(event, value) => setActiveTab(value)}
                        sx={{
                            minHeight: 40,
                            "& .MuiTab-root": {
                                fontSize: 13,
                                minHeight: 40,
                                px: 2,
                                textTransform: "none",
                            },
                            "& .Mui-selected": {
                                color: "#1f2328",
                                fontWeight: 700,
                            },
                            "& .MuiTabs-indicator": {
                                bgcolor: "#1f2328",
                            },
                        }}
                    >
                        {tabs.map((tab) => (
                            <Tab key={tab} label={tab} />
                        ))}
                    </Tabs>
                    <Divider sx={{ mb: 2 }} />
                    {loading && <LinearProgress sx={{ mb: 2 }} />}
                    {errorMessage && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Failed to load scheduler configuration:{" "}
                            {errorMessage}
                        </Alert>
                    )}
                    {tabContent[activeTab]}
                </CardContent>
            </Card>
        </Box>
    );
};

export default Configuration;
