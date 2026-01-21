import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const StatCard = ({ title, value, icon }) => (
    <Paper
        sx={{
            p: 2,
            height: "100%",
        }}
    >
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flex: 1,
            }}
        >
            <Typography variant="subtitle2" color="textSecondary">
                {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
        </Box>
        <Box mt={2}>{icon}</Box>
    </Paper>
);

export default StatCard;
