import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const StatCard = ({ title, value, icon }) => (
    <Paper
        sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
