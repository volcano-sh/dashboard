import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";

import StatCard from "./Charts/StatCard";
import JobStatusPieChart from "./Charts/JobStatusPieChart";
import QueueResourcesBarChart from "./Charts/QueueResourcesBarChart";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    jobs: [],
    queues: [],
    pods: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [jobsRes, queuesRes, podsRes] = await Promise.all([
        fetch("/api/jobs?limit=1000"),
        fetch("/api/queues?limit=1000"),
        fetch("/api/pods?limit=1000"),
      ]);

      const [jobsData, queuesData, podsData] = await Promise.all([
        jobsRes.json(),
        queuesRes.json(),
        podsRes.json(),
      ]);

      setDashboardData({
        jobs: jobsData.items || [],
        queues: queuesData.items || [],
        pods: podsData.items || [],
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      {error && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "error.light",
            color: "error.contrastText",
          }}
        >
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        {/* Add any header components or buttons here if necessary */}
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Jobs"
            value={dashboardData.jobs?.length || 0}
            icon={<img
              src="/job2.png"
              alt="Jobs Icon"
              style={{ width: 100, height: 100 }}
            />
            }
            sx={{
              width: "100%",
              height: "250px",
              borderRadius: "16px",
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)", // More visible shadow
              transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.5)", // Stronger shadow on hover
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Queues"
            value={dashboardData.queues?.filter((q) => q.status?.state === "Open")?.length || 0}
            icon={<img
              src="/queues.png"
              alt="Jobs Icon"
              style={{ width: 100, height: 100 }}
            />
            }
            sx={{
              width: "100%",
              height: "250px",
              borderRadius: "16px",
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)", // More visible shadow
              transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.5)", // Stronger shadow on hover
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Running Pods"
            value={dashboardData.pods?.filter((p) => p.status?.phase === "Running")?.length || 0}
            icon={<img
              src="/connect.png"
              alt="Jobs Icon"
              style={{ width: 100, height: 100 }}
            />
            }
            sx={{
              width: "100%",
              height: "250px",
              borderRadius: "16px",
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)", // More visible shadow
              transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.5)", // Stronger shadow on hover
              },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Complete Rate"
            value={`${calculateSuccessRate(dashboardData.jobs)}%`}
            icon={<img
              src="/complete.png"
              alt="Jobs Icon"
              style={{ width: 100, height: 100 }}
            />
            }
            sx={{
              width: "100%",
              height: "250px",
              borderRadius: "16px",
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)", // More visible shadow
              transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.5)", // Stronger shadow on hover
              },
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0, mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              height: "calc(100vh - 250px)",
              display: "flex",
              flexDirection: "column",
              p: 2,
            }}
          >
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: "100%" }}>
                <JobStatusPieChart data={dashboardData.jobs} />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              height: "calc(100vh - 250px)",
              display: "flex",
              flexDirection: "column",
              p: 2,
            }}
          >
            {isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: "100%" }}>
                <QueueResourcesBarChart data={dashboardData.queues} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const calculateSuccessRate = (jobs) => {
  if (!jobs || jobs.length === 0) return 0;
  const completed = jobs.filter(
    (job) => job.status?.succeeded || job.status?.state?.phase === "Completed"
  ).length;
  const finished = jobs.filter(
    (job) =>
      job.status?.succeeded ||
      job.status?.failed ||
      job.status?.state?.phase === "Completed" ||
      job.status?.state?.phase === "Failed"
  ).length;
  return finished === 0 ? 0 : Math.round((completed / finished) * 100);
};

export default Dashboard;
