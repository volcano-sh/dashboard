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
    }
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

  const CustomLegend = () => (
    <Box sx={{ pl: 2 }}>
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
          <Typography variant="body2" sx={{ mr: 2 }}>
            {status}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {count} ({total > 0 ? ((count / total) * 100).toFixed(1) : 0}%)
          </Typography>
        </Box>
      ))}
    </Box>
  );

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

      <Grid container spacing={2} sx={{ flex: 1 }}>
        <Grid item xs={8}>
          <Box
            sx={{
              height: "75%", // 增加饼图高度至卡片的约2/3
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mt: 2, // 向下微调位置
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
        </Grid>
        <Grid item xs={4}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start", // 将图例向上对齐
              mt: 4, // 向上移动图例
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
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {count} ({total > 0 ? ((count / total) * 100).toFixed(1) : 0}
                  %)
                </Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobStatusPieChart;
