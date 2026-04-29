import React, { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Stack,
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
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import BalanceIcon from "@mui/icons-material/Balance";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutline";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import { useQuery } from "@tanstack/react-query";
import { fetchSchedulerConfig } from "../../lib/client/dashboard-api";

type SchedulerPlugin = {
    actions?: string[];
    arguments?: unknown;
    enabled?: boolean;
    hooks?: string[];
    name: string;
    tier?: string;
};

const tabs = [
    "Scheduler Configuration",
    "Scheduling Flow",
    "Plugins",
    "Raw Scheduler YAML",
];

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

const pluginIconMap = {
    gang: HubOutlinedIcon,
    priority: BalanceIcon,
    drf: BalanceIcon,
    predicates: FilterAltOutlinedIcon,
    nodeorder: ViewListOutlinedIcon,
    binpack: Inventory2OutlinedIcon,
    proportion: PieChartOutlineIcon,
    conformance: ChecklistRtlIcon,
    overcommit: Inventory2OutlinedIcon,
};

const PluginIcon = ({ name }) => {
    const IconComponent =
        pluginIconMap[String(name || "").toLowerCase()] || ChecklistRtlIcon;

    return (
        <Box
            sx={{
                alignItems: "center",
                color: "#1f2328",
                display: "inline-flex",
                flexShrink: 0,
                justifyContent: "center",
            }}
        >
            <IconComponent sx={{ fontSize: 24 }} />
        </Box>
    );
};

const flowCardBorder = "#dfe3e8";
const flowMutedBorder = "#e6e8eb";
const flowHeaderBg = "#f7f8fa";
const flowPanelBg = "#fbfcfd";
const flowStepBg = "#f6f8fa";
const flowTextPrimary = "#1f2328";
const flowTextSecondary = "#57606a";
const flowStageWidth = 304;

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
        </Box>
    );
};

const SchedulingFlowPanel = ({ config }) => {
    const flow = config?.flow || {};
    const flowActions = flow.actions || [];
    const stepsByAction = flow.stepsByAction || {};

    return (
        <Box>
            <Box
                sx={{
                    border: "1px solid #e1e4e8",
                    borderRadius: 1,
                    mt: 2,
                    overflow: "hidden",
                }}
            >
                <Box sx={{ p: 2, pb: 1 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                        Scheduling Flow
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ fontSize: 12, mt: 0.5 }}
                    >
                        A configuration-driven view of how Volcano actions enter
                        derived hooks and invoke enabled plugins when needed.
                    </Typography>
                </Box>
                {flowActions.length ? (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <Box
                            sx={{
                                alignItems: "stretch",
                                display: "flex",
                                flexDirection: { xs: "column", xl: "row" },
                                gap: 1.5,
                                overflowX: "auto",
                                pb: 0.5,
                            }}
                        >
                            <Box
                                sx={{
                                    alignItems: "flex-start",
                                    bgcolor: flowPanelBg,
                                    border: `1px solid ${flowCardBorder}`,
                                    borderRadius: 2,
                                    display: "flex",
                                    flexShrink: 0,
                                    justifyContent: "center",
                                    minHeight: { xs: "auto", xl: 188 },
                                    minWidth: { xs: "100%", xl: 156 },
                                    p: 1.75,
                                }}
                            >
                                <Box
                                    sx={{ textAlign: "center", width: "100%" }}
                                >
                                    <Box
                                        sx={{
                                            alignItems: "center",
                                            bgcolor: "white",
                                            border: `1px solid ${flowMutedBorder}`,
                                            borderRadius: 1,
                                            display: "inline-flex",
                                            justifyContent: "center",
                                            mb: 1,
                                            p: 0.85,
                                        }}
                                    >
                                        <ChecklistRtlIcon
                                            sx={{
                                                color: flowTextSecondary,
                                                fontSize: 20,
                                            }}
                                        />
                                    </Box>
                                    <Typography
                                        sx={{
                                            color: flowTextPrimary,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            letterSpacing: 0.1,
                                        }}
                                    >
                                        Job Submission
                                    </Typography>
                                    <Box
                                        sx={{
                                            color: flowTextSecondary,
                                            fontSize: 11.5,
                                            lineHeight: 1.45,
                                            mt: 0.6,
                                            mx: "auto",
                                            maxWidth: 116,
                                        }}
                                    >
                                        Scheduler receives the job and applies
                                        configured actions in order.
                                    </Box>
                                </Box>
                            </Box>
                            {flowActions.map((action) => {
                                const steps = stepsByAction[action.name] || [];

                                return (
                                    <React.Fragment key={action.name}>
                                        <Box
                                            sx={{
                                                alignItems: "center",
                                                color: flowTextSecondary,
                                                display: "flex",
                                                flexShrink: 0,
                                                justifyContent: "center",
                                                minHeight: {
                                                    xs: 32,
                                                    xl: "auto",
                                                },
                                                px: { xs: 0, xl: 0.15 },
                                            }}
                                        >
                                            <ArrowForwardIcon
                                                sx={{
                                                    fontSize: 24,
                                                    transform: {
                                                        xs: "rotate(90deg)",
                                                        xl: "none",
                                                    },
                                                }}
                                            />
                                        </Box>
                                        <Box
                                            sx={{
                                                bgcolor: "white",
                                                border: `1px solid ${flowCardBorder}`,
                                                borderRadius: 2,
                                                display: "flex",
                                                flexDirection: "column",
                                                flexGrow: 1,
                                                maxWidth: {
                                                    xs: "100%",
                                                    xl: flowStageWidth,
                                                },
                                                minWidth: {
                                                    xs: "100%",
                                                    xl: flowStageWidth,
                                                },
                                                overflow: "hidden",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    bgcolor: flowHeaderBg,
                                                    borderBottom: `1px solid ${flowCardBorder}`,
                                                    px: 1.5,
                                                    py: 1.1,
                                                }}
                                            >
                                                <Stack
                                                    alignItems="center"
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ mb: 0.2 }}
                                                >
                                                    <Box
                                                        sx={{
                                                            alignItems:
                                                                "center",
                                                            bgcolor: "#2f353d",
                                                            borderRadius: "50%",
                                                            color: "white",
                                                            display:
                                                                "inline-flex",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            height: 22,
                                                            justifyContent:
                                                                "center",
                                                            width: 22,
                                                        }}
                                                    >
                                                        {action.order}
                                                    </Box>
                                                    <Typography
                                                        sx={{
                                                            color: flowTextPrimary,
                                                            fontSize: 14,
                                                            fontWeight: 700,
                                                            letterSpacing: 0.2,
                                                        }}
                                                    >
                                                        {action.title}
                                                    </Typography>
                                                </Stack>
                                                <Typography
                                                    sx={{
                                                        color: flowTextPrimary,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        lineHeight: 1.35,
                                                        pl: 3.25,
                                                    }}
                                                >
                                                    ({action.subtitle})
                                                </Typography>
                                            </Box>
                                            <Box sx={{ p: 1.5 }}>
                                                <Typography
                                                    sx={{
                                                        color: flowTextPrimary,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        lineHeight: 1.45,
                                                        mb: 1.25,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Goal:{" "}
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            color: flowTextSecondary,
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {action.goal}
                                                    </Box>
                                                </Typography>
                                                {steps.length ? (
                                                    <Stack spacing={1}>
                                                        {steps.map((step) => (
                                                            <Box
                                                                key={`${action.name}-${step.hook}`}
                                                                sx={{
                                                                    alignItems:
                                                                        "stretch",
                                                                    display:
                                                                        "flex",
                                                                    gap: 0.75,
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        alignItems:
                                                                            "center",
                                                                        bgcolor:
                                                                            flowStepBg,
                                                                        border: `1px solid ${flowMutedBorder}`,
                                                                        borderRadius: 1,
                                                                        color: flowTextPrimary,
                                                                        display:
                                                                            "inline-flex",
                                                                        flexShrink: 0,
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        lineHeight: 1.2,
                                                                        justifyContent:
                                                                            "center",
                                                                        minHeight: 32,
                                                                        minWidth: 54,
                                                                        px: 0.75,
                                                                    }}
                                                                >
                                                                    {step.label}
                                                                </Box>
                                                                <Box
                                                                    sx={{
                                                                        alignItems:
                                                                            "center",
                                                                        color: flowTextSecondary,
                                                                        display:
                                                                            "flex",
                                                                        flexShrink: 0,
                                                                        px: 0.15,
                                                                    }}
                                                                >
                                                                    <ArrowForwardIcon
                                                                        sx={{
                                                                            fontSize: 16,
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Stack
                                                                    spacing={1}
                                                                    sx={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    {step
                                                                        .plugins
                                                                        .length ? (
                                                                        step.plugins.map(
                                                                            (
                                                                                plugin,
                                                                            ) => (
                                                                                <Box
                                                                                    key={`${action.name}-${step.hook}-${plugin.name}`}
                                                                                    sx={{
                                                                                        bgcolor:
                                                                                            flowPanelBg,
                                                                                        border: `1px solid ${flowMutedBorder}`,
                                                                                        borderRadius: 1.5,
                                                                                        minHeight: 72,
                                                                                        p: 0.9,
                                                                                    }}
                                                                                >
                                                                                    <Stack
                                                                                        direction="row"
                                                                                        spacing={
                                                                                            0.9
                                                                                        }
                                                                                    >
                                                                                        <PluginIcon
                                                                                            name={
                                                                                                plugin.name
                                                                                            }
                                                                                        />
                                                                                        <Box
                                                                                            sx={{
                                                                                                minWidth: 0,
                                                                                            }}
                                                                                        >
                                                                                            <Stack
                                                                                                alignItems="center"
                                                                                                direction="row"
                                                                                                spacing={
                                                                                                    0.5
                                                                                                }
                                                                                                sx={{
                                                                                                    flexWrap:
                                                                                                        "wrap",
                                                                                                    mb: 0.15,
                                                                                                }}
                                                                                            >
                                                                                                <Typography
                                                                                                    sx={{
                                                                                                        color: flowTextPrimary,
                                                                                                        fontSize: 12.5,
                                                                                                        fontWeight: 700,
                                                                                                        lineHeight: 1.3,
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        plugin.name
                                                                                                    }
                                                                                                </Typography>
                                                                                                <Chip
                                                                                                    label={
                                                                                                        step.hook
                                                                                                    }
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        bgcolor:
                                                                                                            "white",
                                                                                                        borderColor:
                                                                                                            flowMutedBorder,
                                                                                                        color: flowTextSecondary,
                                                                                                        fontSize: 10,
                                                                                                        height: 19,
                                                                                                    }}
                                                                                                    variant="outlined"
                                                                                                />
                                                                                            </Stack>
                                                                                            <Typography
                                                                                                sx={{
                                                                                                    color: flowTextSecondary,
                                                                                                    display:
                                                                                                        "-webkit-box",
                                                                                                    fontSize: 11.5,
                                                                                                    lineHeight: 1.45,
                                                                                                    minHeight: 32,
                                                                                                    overflow:
                                                                                                        "hidden",
                                                                                                    WebkitBoxOrient:
                                                                                                        "vertical",
                                                                                                    WebkitLineClamp: 2,
                                                                                                }}
                                                                                            >
                                                                                                {
                                                                                                    plugin.description
                                                                                                }
                                                                                            </Typography>
                                                                                            {Object.keys(
                                                                                                plugin.arguments ||
                                                                                                    {},
                                                                                            )
                                                                                                .length ? (
                                                                                                <Typography
                                                                                                    sx={{
                                                                                                        color: flowTextSecondary,
                                                                                                        fontFamily:
                                                                                                            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
                                                                                                        fontSize: 10,
                                                                                                        mt: 0.55,
                                                                                                    }}
                                                                                                >
                                                                                                    {valueOrDash(
                                                                                                        plugin.arguments,
                                                                                                    )}
                                                                                                </Typography>
                                                                                            ) : null}
                                                                                        </Box>
                                                                                    </Stack>
                                                                                </Box>
                                                                            ),
                                                                        )
                                                                    ) : (
                                                                        <Box
                                                                            sx={{
                                                                                border: `1px dashed ${flowMutedBorder}`,
                                                                                borderRadius: 1.5,
                                                                                color: flowTextSecondary,
                                                                                fontSize: 11.5,
                                                                                p: 1,
                                                                            }}
                                                                        >
                                                                            No
                                                                            mapped
                                                                            plugin
                                                                            in
                                                                            this
                                                                            step.
                                                                        </Box>
                                                                    )}
                                                                </Stack>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <EmptyState>
                                                        No derived steps
                                                        available for this
                                                        action.
                                                    </EmptyState>
                                                )}
                                            </Box>
                                            <Box
                                                sx={{
                                                    bgcolor: flowHeaderBg,
                                                    borderTop: `1px solid ${flowCardBorder}`,
                                                    px: 1.5,
                                                    py: 1,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        color: flowTextPrimary,
                                                        fontSize: 12.5,
                                                        fontWeight: 700,
                                                        mb: 0.45,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Result
                                                </Typography>
                                                <Stack
                                                    direction={{
                                                        xs: "column",
                                                        sm: "row",
                                                    }}
                                                    spacing={1.5}
                                                    sx={{
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        rowGap: 0.4,
                                                    }}
                                                >
                                                    <Stack
                                                        alignItems="center"
                                                        direction="row"
                                                        spacing={0.75}
                                                    >
                                                        <CheckIcon
                                                            sx={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {
                                                                action.resultSuccess
                                                            }
                                                        </Typography>
                                                    </Stack>
                                                    <Typography
                                                        sx={{
                                                            color: flowTextSecondary,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        /
                                                    </Typography>
                                                    <Stack
                                                        alignItems="center"
                                                        direction="row"
                                                        spacing={0.75}
                                                    >
                                                        <CloseIcon
                                                            sx={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {
                                                                action.resultFailure
                                                            }
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </React.Fragment>
                                );
                            })}
                        </Box>
                        <Box
                            sx={{
                                bgcolor: flowPanelBg,
                                border: `1px solid ${flowMutedBorder}`,
                                borderRadius: 1,
                                mt: 2.5,
                                p: 1.5,
                            }}
                        >
                            <Typography
                                sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}
                            >
                                Flow Legend
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12, mb: 0.5 }}
                            >
                                <strong>Configured:</strong>{" "}
                                {flow.legend?.configured ||
                                    "Actions, tiers, and plugins come directly from the active scheduler ConfigMap."}
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12, mb: 0.5 }}
                            >
                                <strong>Derived:</strong>{" "}
                                {flow.legend?.derived ||
                                    "Hooks and action-to-plugin relationships are derived from Volcano scheduling semantics."}
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12 }}
                            >
                                <strong>Step order:</strong> Plugins rendered in
                                the same step participate in the same hook of
                                that action, following the configured scheduling
                                order.
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <EmptyState>No scheduler actions found.</EmptyState>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const RawYamlPanel = ({ config }) => {
    return (
        <Box>
            <Box
                sx={{
                    bgcolor: flowPanelBg,
                    border: `1px solid ${flowMutedBorder}`,
                    borderRadius: 1,
                    mt: 3,
                    p: 1.5,
                }}
            >
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                    Raw Scheduler YAML
                </Typography>
                <Box
                    component="pre"
                    sx={{
                        bgcolor: "white",
                        border: `1px solid ${flowMutedBorder}`,
                        borderRadius: 1,
                        color: flowTextPrimary,
                        fontFamily:
                            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
                        fontSize: 12,
                        lineHeight: 1.5,
                        maxHeight: 280,
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

const PluginsPanel = ({ config }) => {
    const plugins: SchedulerPlugin[] =
        config?.flow?.plugins || config?.plugins || [];
    const tiers = Object.entries(
        plugins.reduce<Record<string, SchedulerPlugin[]>>((grouped, plugin) => {
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
                                        <Typography
                                            color="text.secondary"
                                            sx={{ fontSize: 11, mt: 0.5 }}
                                        >
                                            {plugin.actions?.length
                                                ? `Actions: ${plugin.actions.join(", ")}`
                                                : "Action mapping unavailable"}
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
                            <TableCell>Hooks</TableCell>
                            <TableCell>Actions</TableCell>
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
                                        {plugin.hooks?.length
                                            ? plugin.hooks.join(", ")
                                            : "Unavailable"}
                                    </TableCell>
                                    <TableCell>
                                        {plugin.actions?.length
                                            ? plugin.actions.join(", ")
                                            : "Unavailable"}
                                    </TableCell>
                                    <TableCell>
                                        {valueOrDash(plugin.arguments)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6}>
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
    const axiosError = error as
        | (Error & { response?: { data?: { error?: string; message?: string } } })
        | null;
    const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.error ||
        axiosError?.message;

    const tabContent = useMemo(
        () => [
            <SchedulerPanel config={config} key="scheduler" />,
            <SchedulingFlowPanel config={config} key="flow" />,
            <PluginsPanel config={config} key="plugins" />,
            <RawYamlPanel config={config} key="raw-yaml" />,
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
