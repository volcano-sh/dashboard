import React from "react";
import { Box, Paper, SvgIconProps, Typography } from "@mui/material";

interface StatCardProps {
    title: string;
    value: number | string;
    icon?: React.ReactElement<SvgIconProps>;
}
const StatCard = ({ title, value, icon }: StatCardProps) => (
    <Paper
        sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
        }}
    >
        <Box>
            <Typography variant="subtitle2" color="textSecondary">
                {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
        </Box>
        {icon}
    </Paper>
);

export default StatCard;
