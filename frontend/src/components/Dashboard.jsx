import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import StatCard from "./Charts/StatCard";
import JobStatusPieChart from "./Charts/JobStatusPieChart";
import QueueResourcesBarChart from "./Charts/QueueResourcesBarChart";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({ jobs: [], queues: [], pods: [] });
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

      if (!jobsRes.ok) throw new Error(`Jobs API error: ${jobsRes.status}`);
      if (!queuesRes.ok) throw new Error(`Queues API error: ${queuesRes.status}`);
      if (!podsRes.ok) throw new Error(`Pods API error: ${podsRes.status}`);

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

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <Box sx={{ height: "100vh", p: 3, bgcolor: "#f4f6f8" }}>
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "error.light", color: "error.contrastText" }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(45deg, #ff9800, #ff5722)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Volcano Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchAllData} disabled={refreshing}>
            <RefreshIcon sx={{ color: "#ff9800", transition: "0.3s", '&:hover': { color: "#ff5722" } }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Jobs" value={dashboardData.jobs?.length || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Queues" value={dashboardData.queues?.filter(q => q.status?.state === "Open")?.length || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Running Pods" value={dashboardData.pods?.filter(p => p.status?.phase === "Running")?.length || 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Complete Rate" value={`${calculateSuccessRate(dashboardData.jobs)}%`} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: "400px", p: 2, boxShadow: 3, borderRadius: 2 }}>
            {isLoading ? <LoadingIndicator /> : <JobStatusPieChart data={dashboardData.jobs} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ height: "400px", p: 2, boxShadow: 3, borderRadius: 2 }}>
            {isLoading ? <LoadingIndicator /> : <QueueResourcesBarChart data={dashboardData.queues} />}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const LoadingIndicator = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
    <CircularProgress />
  </Box>
);

const calculateSuccessRate = (jobs) => {
  if (!jobs || jobs.length === 0) return 0;
  const completed = jobs.filter(job => job.status?.succeeded || job.status?.state?.phase === "Completed").length;
  const finished = jobs.filter(job => job.status?.succeeded || job.status?.failed || job.status?.state?.phase === "Completed" || job.status?.state?.phase === "Failed").length;
  return finished === 0 ? 0 : Math.round((completed / finished) * 100);
};

export default Dashboard;