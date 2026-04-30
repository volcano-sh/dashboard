import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";

export const RESOURCE_STATUS_COLORS = {
    capability: "#d8dadd",
    deserved: "#3b82f6",
    guarantee: "#34a853",
    used: "#7c3aed",
};

export const getUsageToneColor = (tone) => {
    if (tone === "hot") return "#cf2727";
    if (tone === "starving") return "#d86b00";
    if (tone === "underused") return "#a16207";
    if (tone === "idle") return "#69707a";
    return "#12833f";
};

const ResourceTrack = ({ stats }) => {
    const blueLeft = Math.min(stats.guaranteePercent, stats.deservedPercent);
    const blueWidth = Math.max(stats.deservedPercent - blueLeft, 0);

    return (
        <Box
            sx={{
                bgcolor: RESOURCE_STATUS_COLORS.capability,
                borderRadius: 999,
                height: 6,
                overflow: "visible",
                position: "relative",
            }}
        >
            <Box
                sx={{
                    bgcolor: RESOURCE_STATUS_COLORS.guarantee,
                    borderRadius: "999px 0 0 999px",
                    height: "100%",
                    left: 0,
                    position: "absolute",
                    top: 0,
                    width: `${stats.guaranteePercent}%`,
                }}
            />
            <Box
                sx={{
                    bgcolor: RESOURCE_STATUS_COLORS.deserved,
                    height: "100%",
                    left: `${blueLeft}%`,
                    position: "absolute",
                    top: 0,
                    width: `${blueWidth}%`,
                }}
            />
            <Box
                sx={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `8px solid ${RESOURCE_STATUS_COLORS.used}`,
                    left: `calc(${stats.usedPercent}% - 5px)`,
                    position: "absolute",
                    top: -9,
                }}
            />
        </Box>
    );
};

export const ResourceStatusLegend = () => (
    <Box
        sx={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: 2.25,
            justifyContent: "center",
        }}
    >
        {[
            [RESOURCE_STATUS_COLORS.guarantee, "Requested"],
            [RESOURCE_STATUS_COLORS.deserved, "Deserved"],
            [RESOURCE_STATUS_COLORS.capability, "Capability"],
        ].map(([color, label]) => (
            <Box
                key={label}
                sx={{ alignItems: "center", display: "flex", gap: 0.6 }}
            >
                <Box
                    sx={{
                        bgcolor: color,
                        borderRadius: 0.5,
                        height: 10,
                        width: 10,
                    }}
                />
                <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                    {label}
                </Typography>
            </Box>
        ))}
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.6 }}>
            <Box
                sx={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `8px solid ${RESOURCE_STATUS_COLORS.used}`,
                    height: 0,
                    width: 0,
                }}
            />
            <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                Allocated
            </Typography>
        </Box>
    </Box>
);

export const ResourceStatusBar = ({ resource, stats, valueText }) => {
    const tooltip = [
        `${resource.label}`,
        `Requested: ${stats.requestedLabel || stats.guaranteeLabel}`,
        `Allocated: ${stats.usedLabel}`,
        `Deserved: ${stats.deservedLabel}`,
        `Capability: ${stats.capabilityLabel}`,
        `Allocated / deserved: ${stats.usageLabel}`,
        `Values: ${valueText}`,
        stats.overCapability ? "Allocated exceeds capability" : null,
    ]
        .filter(Boolean)
        .join("\n");

    const bar = (
        <Box
            sx={{
                alignItems: "center",
                display: "grid",
                gap: 0.9,
                gridTemplateColumns: "58px minmax(120px, 1fr) 64px",
                minHeight: 20,
                width: "100%",
            }}
        >
            <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                {resource.label}
            </Typography>
            <ResourceTrack stats={stats} />
            <Typography
                sx={{
                    color: getUsageToneColor(stats.usageTone),
                    fontFamily:
                        '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                }}
            >
                {stats.usageLabel}
            </Typography>
        </Box>
    );

    return (
        <Tooltip
            title={<Box sx={{ whiteSpace: "pre-line" }}>{tooltip}</Box>}
            placement="top"
        >
            {bar}
        </Tooltip>
    );
};

export const ResourceStatusBars = ({ resources }) => (
    <Box sx={{ display: "grid", gap: 0.65, minWidth: 320, py: 0.25 }}>
        {resources.map((item) => (
            <ResourceStatusBar
                key={item.resource.key}
                resource={item.resource}
                stats={item.stats}
                valueText={item.valueText}
            />
        ))}
    </Box>
);

export const ResourceStatusDetailBar = ({
    resource,
    scaleLabels,
    stats,
    valueText,
}) => (
    <Box
        sx={{
            alignItems: "center",
            display: "grid",
            gap: 2,
            gridTemplateColumns: "90px minmax(260px, 1fr) 270px",
            py: 1.35,
        }}
    >
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
            {resource.label}
        </Typography>
        <Box sx={{ pb: 1.5, position: "relative" }}>
            <ResourceTrack stats={stats} />
            <Box
                sx={{
                    color: "text.secondary",
                    display: "flex",
                    fontSize: 11,
                    justifyContent: "space-between",
                    mt: 0.75,
                }}
            >
                {scaleLabels.map((label, index) => (
                    <span key={`${label}-${index}`}>{label}</span>
                ))}
            </Box>
        </Box>
        <Typography
            sx={{
                color: getUsageToneColor(stats.usageTone),
                fontFamily:
                    '"SFMono-Regular", "Roboto Mono", Consolas, monospace',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
            }}
        >
            {valueText}
        </Typography>
    </Box>
);
