import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  LinearProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WorkIcon from '@mui/icons-material/Work';
import QueueIcon from '@mui/icons-material/Queue';
import DnsIcon from '@mui/icons-material/Dns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const Dashboard = () => {
  const theme = useTheme();
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

  const statCards = [
    {
      title: 'Total Jobs',
      value: dashboardData.jobs?.length || 0,
      icon: <WorkIcon />,
      trend: '+5%',
      bgColor: '#F17674', // Coral red
      textColor: 'white',  // White text for contrast
    },
    {
      title: 'Active Queues',
      value: dashboardData.queues?.filter(q => q.status?.state === "Open")?.length || 0,
      icon: <QueueIcon />,
      trend: '+2%',
      bgColor: '#4CAF50', // Material green
      textColor: 'white',
    },
    {
      title: 'Running Pods',
      value: dashboardData.pods?.filter(p => p.status?.phase === "Running")?.length || 0,
      icon: <DnsIcon />,
      trend: '-3%',
      bgColor: '#2196F3', // Material blue
      textColor: 'white',
    },
    {
      title: 'Complete Rate',
      value: `${calculateSuccessRate(dashboardData.jobs)}%`,
      icon: <CheckCircleIcon />,
      trend: '+1%',
      bgColor: '#FF9800', // Material orange
      textColor: 'white',
    },
  ];


  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: 'background.default', 
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            mb: 1
          }}>
            Volcano Dashboard
          </Typography>
 <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', color: 'black' }}>
      Real-time cluster monitoring
    </Typography>
        </Box>
        <IconButton 
          onClick={fetchAllData} 
          disabled={refreshing}
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
            p: 2,
            '&:hover': { 
              bgcolor: 'action.hover',
              boxShadow: 2
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card 
              raised 
              sx={{ 
                bgcolor: stat.bgColor,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  {stat.icon}
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {stat.trendUp ? 
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} /> :
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                      }
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: stat.trendUp ? 'success.main' : 'error.main',
                          ml: 0.5
                        }}
                      >
                        {stat.trend}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {stat.title}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.random() * 100} 
                  sx={{ 
                    height: 6,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: stat.color
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Jobs Status */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="h6" sx={{ 
              mb: 3,
              fontWeight: 'bold',
              color: theme.palette.text.primary
            }}>
              Jobs Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              {['Completed', 'Running', 'Failed'].map((status, index) => (
                <Box 
                  key={status} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: theme.palette.grey[50],
                    '&:hover': {
                      bgcolor: theme.palette.grey[100]
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: index === 0 ? 'success.main' : 
                              index === 1 ? 'info.main' : 
                              'error.main',
                      mr: 2,
                      boxShadow: 1
                    }} 
                  />
                  <Typography sx={{ flex: 1 }}>
                    {status}
                  </Typography>
                  <Typography sx={{ fontWeight: 'medium' }}>
                    (0%)
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  color: theme.palette.grey[300],
                  fontWeight: 'bold'
                }}
              >
                0
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Queue Resources */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Queue Resources
              </Typography>
              <Select
                size="small"
                value=""
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.grey[300]
                  }
                }}
              >
                <MenuItem value="">Select Resource</MenuItem>
              </Select>
            </Box>
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1,
                bgcolor: theme.palette.grey[50],
                borderRadius: 2,
                p: 3
              }}
            >
              <Typography 
                color="text.secondary"
                sx={{ 
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}
              >
                No data available for selected resource type
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Loading Overlay */}
      {isLoading && (
        <Box 
          sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};

const calculateSuccessRate = (jobs) => {
  if (!jobs || jobs.length === 0) return 0;
  const completed = jobs.filter(job => job.status?.succeeded || job.status?.state?.phase === "Completed").length;
  const finished = jobs.filter(job => job.status?.succeeded || job.status?.failed || job.status?.state?.phase === "Completed" || job.status?.state?.phase === "Failed").length;
  return finished === 0 ? 0 : Math.round((completed / finished) * 100);
};

export default Dashboard;