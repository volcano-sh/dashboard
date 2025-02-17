import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const StatCard = ({ title, value, icon }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '8px', // Optional, for rounded corners
      boxShadow: '0 5px 5px rgba(0, 0, 0, 0.5)', // Keep the box shadow
      transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 5px 5px rgba(0, 0, 0, 0.5)', // Stronger shadow on hover
      },
    }}
  >
    <Box>
      <Typography variant="subtitle2" color="textSecondary">
        {title}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          color: "rgb(205, 53, 15)", // Solid orange color
        }}
      >
        {value}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {icon}
    </Box>
  </Paper>
);

export default StatCard;
