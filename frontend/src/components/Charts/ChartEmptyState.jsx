import React from "react";
import { Box, Typography } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";

/**
 * Shared empty-state placeholder for chart components.
 * Rendered when the data prop is null, undefined, or an empty array.
 */
const ChartEmptyState = ({ message = "No data available", height = "100%" }) => (
    <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height,
            gap: 1,
        }}
        data-testid="chart-empty-state"
    >
        <BarChartIcon sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography variant="body2" color="text.secondary" align="center">
            {message}
        </Typography>
    </Box>
);

export default ChartEmptyState;
