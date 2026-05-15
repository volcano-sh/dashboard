import React from "react";
import { Box, Typography } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { useTranslation } from "react-i18next";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const JobStatusPieChart = ({ data }) => {
    const { t } = useTranslation();

    const statusItems = [
        {
            key: "completed",
            label: t("dashboard.charts.jobStatus.status.completed"),
            color: "#4caf50",
        },
        {
            key: "running",
            label: t("dashboard.charts.jobStatus.status.running"),
            color: "#2196f3",
        },
        {
            key: "failed",
            label: t("dashboard.charts.jobStatus.status.failed"),
            color: "#f44336",
        },
    ];

    if (!data || !Array.isArray(data)) {
        return (
            <Box sx={{ height: 300, width: "100%", position: "relative" }}>
                <Typography>
                    {t("dashboard.charts.jobStatus.noDataAvailable")}
                </Typography>
            </Box>
        );
    }

    const statusCounts = data.reduce(
        (acc, job) => {
            const status = job.status;
            if (status?.succeeded) {
                acc.completed++;
            } else if (
                status?.state?.phase === "Running" ||
                status?.state?.phase === "Pending"
            ) {
                acc.running++;
            } else if (status?.state?.phase === "Failed") {
                acc.failed++;
            }
            return acc;
        },
        {
            completed: 0,
            running: 0,
            failed: 0,
        },
    );

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    const chartData = {
        labels: statusItems.map((status) => status.label),
        datasets: [
            {
                data: statusItems.map((status) => statusCounts[status.key]),
                backgroundColor: statusItems.map((status) => status.color),
                borderColor: "white",
                borderWidth: 2,
                hoverBorderColor: "white",
                hoverBorderWidth: 3,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
        },
    };

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                {t("dashboard.charts.jobStatus.title")}
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2,
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        minWidth: "250px",
                        height: "300px",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Doughnut
                        data={chartData}
                        options={{
                            ...options,
                            maintainAspectRatio: false,
                        }}
                    />
                    <Typography
                        variant="h4"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            textAlign: "center",
                        }}
                    >
                        {total}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        minWidth: "250px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        textAlign: "left",
                    }}
                >
                    {statusItems.map((status) => {
                        const count = statusCounts[status.key];

                        return (
                            <Box
                                key={status.key}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        backgroundColor: status.color,
                                        mr: 1,
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{ mr: 2, minWidth: 70 }}
                                >
                                    {status.label}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {count} (
                                    {total > 0
                                        ? ((count / total) * 100).toFixed(1)
                                        : 0}
                                    %)
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default JobStatusPieChart;
