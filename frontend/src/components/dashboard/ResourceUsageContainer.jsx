import { useEffect, useRef, useState } from "react";
import { Paper, Typography } from "@mui/material";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import PodMetricsTable from "./PodMetricsTable";

ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
);

const options = {
    responsive: true,
    animation: false,
    maintainAspectRatio: false,
    scales: {
        y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25 },
            title: {
                display: true,
                text: "Usage (%)",
            },
        },
        x: {
            ticks: false,
            title: {
                display: false,
                text: "Time",
            },
        },
    },
    plugins: {
        legend: { position: "top" },
    },
};

const ResourceUsageContainer = () => {
    const [labels, setLabels] = useState(Array(60).fill(0));
    const [cpuData, setCpuData] = useState([]);
    const [memoryData, setMemoryData] = useState([]);
    const [podMetrics, setPodMetrics] = useState([]);
    const esRef = useRef(null);

    const getResourceMetrics = async () => {
        try {
            esRef.current = new EventSource("/api/metrics");

            esRef.current.onmessage = (event) => {
                const { podMetrics, nodeMetrics: metrics } = JSON.parse(
                    event.data,
                );

                setPodMetrics(podMetrics);

                const now = new Date().toLocaleTimeString();

                const totalMetrics = {
                    cpu_requestTotal: 0,
                    cpu_capacity: 0,
                    mem_requestTotal: 0,
                    mem_capacity: 0,
                };

                metrics.forEach((metric) => {
                    totalMetrics.cpu_requestTotal += parseFloat(
                        metric.cpu.RequestTotal,
                    );
                    totalMetrics.cpu_capacity += parseFloat(
                        metric.cpu.Capacity,
                    );
                    totalMetrics.mem_requestTotal += parseFloat(
                        metric.memory.RequestTotal,
                    );
                    totalMetrics.mem_capacity += parseFloat(
                        metric.memory.Capacity,
                    );
                });

                const cpuUsage =
                    totalMetrics.cpu_capacity === 0
                        ? 0
                        : (totalMetrics.cpu_requestTotal /
                              totalMetrics.cpu_capacity) *
                          100;

                const memUsage =
                    totalMetrics.mem_capacity === 0
                        ? 0
                        : (totalMetrics.mem_requestTotal /
                              totalMetrics.mem_capacity) *
                          100;

                setLabels((prev) => [...prev.slice(-59), now]);
                setCpuData((prev) => [...prev.slice(-59), cpuUsage.toFixed(2)]);
                setMemoryData((prev) => [
                    ...prev.slice(-59),
                    memUsage.toFixed(2),
                ]);
            };
        } catch (error) {
            console.error("Error fetching resource metrics:", error);
        }
    };

    useEffect(() => {
        getResourceMetrics();

        return () => {
            if (esRef.current) {
                esRef.current.close();
            }
        };
    }, []);

    const cpu_data = {
        labels,
        datasets: [
            {
                label: "CPU Usage (%)",
                data: cpuData,
                fill: true,
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.1,
                pointRadius: 0,
            },
        ],
    };

    const memory_data = {
        labels,
        datasets: [
            {
                label: "Memory Usage (%)",
                data: memoryData,
                fill: true,
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                tension: 0.1,
                pointRadius: 0,
            },
        ],
    };

    return (
        <div style={{ background: "#f5f5f5", padding: "20px", width: "100%" }}>
            <Typography variant="h5" style={{ margin: "5px 0 5px 0" }}>
                Resource Usage
            </Typography>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "start",
                    justifyContent: "space-around",
                    gap: "20px",
                    width: "100%",
                    marginTop: "5px",
                }}
            >
                <ResourceGraph data={cpu_data} />
                <ResourceGraph data={memory_data} />
            </div>
            <div style={{ marginTop: "20px", width: "100%" }}>
                <PodMetricsTable podMetrics={podMetrics} />
            </div>
        </div>
    );
};

const ResourceGraph = ({ data }) => {
    return (
        <Paper
            sx={{
                p: 2,
                width: "100%",
                maxWidth: "50%",
                height: "400px",
            }}
        >
            <Line data={data} options={options} />
        </Paper>
    );
};

export default ResourceUsageContainer;
