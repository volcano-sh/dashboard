import { Box, Typography } from "@mui/material";
import { numberFormat, textMuted } from "./overviewStyles";
import { pct } from "./overviewUtils";

const DonutBreakdown = ({ centerLabel, centerValue, segments, unitLabel }) => {
    const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const arcs = segments.reduce(
        (acc, segment) => {
            const length = (segment.value / total) * circumference;
            const arc = {
                ...segment,
                length,
                offset: acc.offset,
            };
            return {
                items: [...acc.items, arc],
                offset: acc.offset + length,
            };
        },
        { items: [], offset: 25 },
    ).items;

    return (
        <Box
            sx={{
                alignItems: "center",
                display: "grid",
                gap: 2,
                gridTemplateColumns: "168px minmax(0, 1fr)",
            }}
        >
            <Box sx={{ position: "relative" }}>
                <svg width="168" height="168" viewBox="0 0 120 120">
                    <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r={radius}
                        stroke="#eef1f4"
                        strokeWidth="18"
                    />
                    {arcs.map((segment) => (
                        <circle
                            key={segment.label}
                            cx="60"
                            cy="60"
                            fill="none"
                            r={radius}
                            stroke={segment.color}
                            strokeDasharray={`${segment.length} ${
                                circumference - segment.length
                            }`}
                            strokeDashoffset={-segment.offset}
                            strokeLinecap="butt"
                            strokeWidth="18"
                            transform="rotate(-90 60 60)"
                        />
                    ))}
                    <circle cx="60" cy="60" fill="#fff" r="29" />
                </svg>
                <Box
                    sx={{
                        left: "50%",
                        position: "absolute",
                        textAlign: "center",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                    }}
                >
                    <Typography sx={{ color: textMuted, fontSize: 11 }}>
                        {centerLabel}
                    </Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
                        {numberFormat.format(centerValue ?? total)}
                    </Typography>
                    {unitLabel && (
                        <Typography sx={{ color: textMuted, fontSize: 11 }}>
                            {unitLabel}
                        </Typography>
                    )}
                </Box>
            </Box>
            <Box sx={{ display: "grid", gap: 0.65 }}>
                {segments.map((segment) => (
                    <Box
                        key={segment.label}
                        sx={{
                            alignItems: "center",
                            borderBottom: "1px solid #eef1f4",
                            display: "grid",
                            gap: 1,
                            gridTemplateColumns: "12px 1fr 54px 54px",
                            py: 0.65,
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: segment.color,
                                borderRadius: 999,
                                height: 8,
                                width: 8,
                            }}
                        />
                        <Typography sx={{ fontSize: 12.5 }}>
                            {segment.label}
                        </Typography>
                        <Typography
                            sx={{ fontSize: 12.5, fontWeight: 700, textAlign: "right" }}
                        >
                            {numberFormat.format(segment.value)}
                        </Typography>
                        <Typography
                            sx={{
                                color: textMuted,
                                fontSize: 12.5,
                                textAlign: "right",
                            }}
                        >
                            {pct(segment.value, total)}%
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default DonutBreakdown;
