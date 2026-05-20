import { Box, Typography } from "@mui/material";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { statusColors } from "./OverviewStatusChip";
import { textMuted } from "./overviewStyles";

const items: Array<[string, string, React.ElementType]> = [
    [
        "Overused",
        "Scheduler marks the queue overused",
        LocalFireDepartmentOutlinedIcon,
    ],
    ["Busy", "Running work with pending PodGroups", LocalFireDepartmentOutlinedIcon],
    ["Starving", "Pending PodGroups with no allocation", WarningAmberOutlinedIcon],
    ["Idle", "No running or pending PodGroups", WarningAmberOutlinedIcon],
];

const OverviewLegend = () => (
    <Box
        sx={{
            alignItems: "center",
            color: textMuted,
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(4, max-content)",
            },
            mt: 2.5,
        }}
    >
        {items.map(([label, text, Icon]) => {
            const colors = statusColors[label];
            return (
                <Box
                    key={label}
                    sx={{ alignItems: "center", display: "flex", gap: 1 }}
                >
                    <Icon sx={{ color: colors.fg, fontSize: 20 }} />
                    <Typography sx={{ fontSize: 12.5 }}>
                        <Box
                            component="span"
                            sx={{ color: "#111827", fontWeight: 700 }}
                        >
                            {label}:
                        </Box>{" "}
                        {text}
                    </Typography>
                </Box>
            );
        })}
    </Box>
);

export default OverviewLegend;
