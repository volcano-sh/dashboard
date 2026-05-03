import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { Line } from "react-chartjs-2";
import "./chartConfig";
import ChartEmptyState from "./ChartEmptyState";

const PodStatusLineChart = ({ data }) => {
    const isEmpty = !data || !Array.isArray(data) || data.length === 0;

    const chartData = useMemo(() => {
        if (isEmpty) return null;
        return {
            labels: data.map((pod) =>
                new Date(pod.metadata.creationTimestamp).toLocaleTimeString(),
            ),
            datasets: [
                {
                    label: "Running Pods",
                    data: data.map((pod) =>
                        pod.status?.phase === "Running" ? 1 : 0,
                    ),
                    borderColor: "#2196f3",
                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                    tension: 0.1,
                    fill: true,
                },
            ],
        };
    }, [data, isEmpty]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    }), []);

    return (
        <Box sx={{ height: 300, width: "100%", position: "relative" }}>
            <Typography variant="h6" gutterBottom>
                Pod Status Timeline
            </Typography>
            {isEmpty ? (
                <ChartEmptyState
                    message="No pod data available"
                    height="calc(100% - 40px)"
                />
            ) : (
                <Line data={chartData} options={options} />
            )}
        </Box>
    );
};

export default PodStatusLineChart;
