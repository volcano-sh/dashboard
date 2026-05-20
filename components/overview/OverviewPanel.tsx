import React from "react";
import {
    type SxProps,
    type Theme,
    Box,
    Card,
    CardContent,
    Typography,
} from "@mui/material";
import { borderColor, panelShadow, textMuted } from "./overviewStyles";

type OverviewPanelProps = {
    children: React.ReactNode;
    sx?: SxProps<Theme>;
};

type OverviewSectionHeaderProps = {
    action?: React.ReactNode;
    subtitle?: React.ReactNode;
    title: React.ReactNode;
};

export const OverviewPanel = ({ children, sx }: OverviewPanelProps) => (
    <Card
        sx={{
            border: `1px solid ${borderColor}`,
            borderRadius: 1.25,
            boxShadow: panelShadow,
            ...sx,
        }}
    >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            {children}
        </CardContent>
    </Card>
);

export const OverviewSectionHeader = ({
    action,
    subtitle,
    title,
}: OverviewSectionHeaderProps) => (
    <Box
        sx={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            mb: 1.75,
        }}
    >
        <Box>
            <Typography component="div" sx={{ fontSize: 18, fontWeight: 800 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography sx={{ color: textMuted, fontSize: 12.5, mt: 0.25 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
        {action}
    </Box>
);
