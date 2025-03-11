import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const JobStatusPieChart = ({ data }) => {
    if (!data || !Array.isArray(data)) {
        return (
            <Box sx={{ height: 300, width: "100%", position: "relative" }}>
                <Typography>No data available</Typography>
            </Box>
        );
    }

    const statusCounts = data.reduce(
        (acc, job) => {
            const status = job.status;
            if (status?.succeeded) {
                acc.Completed++;
            } else if (
                status?.state?.phase === "Running" ||
                status?.state?.phase === "Pending"
            ) {
                acc.Running++;
            } else if (status?.state?.phase === "Failed") {
                acc.Failed++;
            }
            return acc;
        },
        {
            Completed: 0,
            Running: 0,
            Failed: 0,
        },
    );

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const colors = {
        Completed: "#4caf50",
        Running: "#2196f3",
        Failed: "#f44336",
    };

    const chartData = {
        labels: Object.keys(statusCounts),
        datasets: [
            {
                data: Object.values(statusCounts),
                backgroundColor: Object.values(colors),
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

    const hasData = Object.values(statusCounts).some((count) => count > 0);

    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                Jobs Status
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
                        minWidth: "250px", // Ensure that the chart is not too small
                        height: "300px", // Fixed height to adapt to various screens
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
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <Box
                            key={status}
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
                                    backgroundColor: colors[status],
                                    mr: 1,
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{ mr: 2, minWidth: 70 }}
                            >
                                {status}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {count} (
                                {total > 0
                                    ? ((count / total) * 100).toFixed(1)
                                    : 0}
                                %)
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default JobStatusPieChart;
