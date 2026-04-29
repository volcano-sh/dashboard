import React from "react";
import { Chip, type SxProps, type Theme } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const resolveStatusTone = (theme, rawStatus) => {
    const status = (rawStatus || "Unknown").toLowerCase();

    if (
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
        status.includes("init")
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
        status.includes("crash")
    ) {
        return {
            background: alpha(theme.palette.error.main, 0.1),
            border: alpha(theme.palette.error.main, 0.24),
            color: theme.palette.error.dark,
        };
    }

    if (status.includes("succeed") || status.includes("complete")) {
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

type PodStatusChipProps = {
    size?: "small" | "medium";
    status?: string;
    sx?: SxProps<Theme>;
};

const PodStatusChip = ({ size = "small", status, sx }: PodStatusChipProps) => {
    const theme = useTheme();
    const tone = resolveStatusTone(theme, status);

    return (
        <Chip
            label={status || "Unknown"}
            size={size}
            sx={{
                bgcolor: tone.background,
                border: `1px solid ${tone.border}`,
                color: tone.color,
                fontSize: size === "small" ? 12 : 12.5,
                fontWeight: 600,
                height: size === "small" ? 28 : 30,
                "& .MuiChip-label": {
                    px: 1.25,
                },
                ...sx,
            }}
        />
    );
};

export default PodStatusChip;
