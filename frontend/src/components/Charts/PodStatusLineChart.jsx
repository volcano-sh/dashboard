import React from "react";
import { Box, Typography } from "@mui/material";
import { Line } from "react-chartjs-2";
import "./chartConfig";
import { useTranslation } from "../../i18n/I18nProvider";

const PodStatusLineChart = ({ data }) => {
    const { t } = useTranslation();
    const chartData = {
        labels: data.map((pod) =>
            new Date(pod.metadata.creationTimestamp).toLocaleTimeString(),
        ),
        datasets: [
            {
                label: t("dashboard.runningPods"),
                data: data.map((pod) =>
                    pod.status.phase === "Running" ? 1 : 0,
                ),
                borderColor: "#2196f3",
                backgroundColor: "rgba(33, 150, 243, 0.1)",
                tension: 0.1,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <Box sx={{ height: 300, width: "100%", position: "relative" }}>
            <Typography variant="h6" gutterBottom>
                {t("pods.timelineTitle")}
            </Typography>
            <Line data={chartData} options={options} />
        </Box>
    );
};

export default PodStatusLineChart;
