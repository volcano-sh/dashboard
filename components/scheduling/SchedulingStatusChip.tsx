import React from "react";
import { Box, Chip, Tooltip, type SxProps, type Theme } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { alpha, useTheme } from "@mui/material/styles";

type StatusTone = {
    background: string;
    border: string;
    color: string;
    label?: string;
    tooltip?: string;
};

type SchedulingStatusChipProps = {
    minWidth?: number;
    showTooltipIcon?: boolean;
    size?: "small" | "medium";
    status?: string;
    sx?: SxProps<Theme>;
    tone?: Partial<StatusTone>;
};

const resolveStatusTone = (theme: Theme, rawStatus?: string): StatusTone => {
    const status = (rawStatus || "Unknown").toLowerCase();

    if (
        status.includes("open") ||
        status.includes("active") ||
        status.includes("run") ||
        status.includes("ready") ||
        status.includes("success")
    ) {
        return {
            background: alpha(theme.palette.success.main, 0.12),
            border: alpha(theme.palette.success.main, 0.28),
            color: theme.palette.success.dark,
        };
    }

    if (
        status.includes("pending") ||
        status.includes("wait") ||
        status.includes("schedul") ||
        status.includes("init") ||
        status.includes("underused") ||
        status.includes("starving")
    ) {
        return {
            background: alpha(theme.palette.warning.main, 0.12),
            border: alpha(theme.palette.warning.main, 0.3),
            color: "#c2410c",
        };
    }

    if (
        status.includes("fail") ||
        status.includes("error") ||
        status.includes("terminated") ||
        status.includes("crash") ||
        status.includes("invalid") ||
        status.includes("hot")
    ) {
        return {
            background: alpha(theme.palette.error.main, 0.1),
            border: alpha(theme.palette.error.main, 0.24),
            color: theme.palette.error.dark,
        };
    }

    if (
        status.includes("succeed") ||
        status.includes("complete") ||
        status.includes("healthy")
    ) {
        return {
            background: alpha(theme.palette.info.main, 0.1),
            border: alpha(theme.palette.info.main, 0.22),
            color: theme.palette.info.dark,
        };
    }

    return {
        background: alpha(theme.palette.grey[500], 0.1),
        border: alpha(theme.palette.grey[500], 0.24),
        color: theme.palette.text.secondary,
    };
};

const SchedulingStatusChip = ({
    minWidth = 78,
    showTooltipIcon = false,
    size = "small",
    status,
    sx,
    tone,
}: SchedulingStatusChipProps) => {
    const theme = useTheme();
    const resolvedTone = {
        ...resolveStatusTone(theme, status),
        ...tone,
    };
    const label = resolvedTone.label || status || "Unknown";
    const chip = (
        <Chip
            label={label}
            size={size}
            sx={{
                bgcolor: resolvedTone.background,
                border: `1px solid ${resolvedTone.border}`,
                color: resolvedTone.color,
                fontSize: size === "small" ? 11 : 12.5,
                fontWeight: 700,
                height: size === "small" ? 24 : 30,
                minWidth,
                "& .MuiChip-label": {
                    px: 1.25,
                },
                ...sx,
            }}
        />
    );

    if (!showTooltipIcon || !resolvedTone.tooltip) return chip;

    return (
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
            {chip}
            <Tooltip title={resolvedTone.tooltip}>
                <InfoOutlinedIcon
                    sx={{ color: "text.disabled", fontSize: 14 }}
                />
            </Tooltip>
        </Box>
    );
};

export default SchedulingStatusChip;
