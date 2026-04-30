import { Chip } from "@mui/material";

export const statusColors: Record<string, { bg: string; fg: string }> = {
    Busy: { bg: "#fff3e6", fg: "#f26b21" },
    Degraded: { bg: "#fff3e6", fg: "#f26b21" },
    Error: { bg: "#fff0f0", fg: "#ef3333" },
    Healthy: { bg: "#eaf8ef", fg: "#159947" },
    Hot: { bg: "#fff0f0", fg: "#ef3333" },
    Idle: { bg: "#eef1f4", fg: "#4b5563" },
    Info: { bg: "#edf4ff", fg: "#155dbb" },
    Overused: { bg: "#fff0f0", fg: "#ef3333" },
    Pending: { bg: "#fff7e8", fg: "#f59e0b" },
    Running: { bg: "#eaf8ef", fg: "#159947" },
    Starving: { bg: "#fff7e8", fg: "#f97316" },
    Succeeded: { bg: "#eef1f4", fg: "#4b5563" },
    Underused: { bg: "#edf4ff", fg: "#155dbb" },
    Warning: { bg: "#fff7e8", fg: "#f97316" },
};

const OverviewStatusChip = ({ label }) => {
    const colors = statusColors[label] || statusColors.Info;
    return (
        <Chip
            label={label}
            size="small"
            sx={{
                bgcolor: colors.bg,
                border: `1px solid ${colors.fg}33`,
                color: colors.fg,
                fontSize: 11.5,
                fontWeight: 700,
                height: 24,
            }}
        />
    );
};

export default OverviewStatusChip;
