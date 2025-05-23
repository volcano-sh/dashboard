import React from "react";
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Divider
} from "@mui/material";

const QueueGridView = ({ queues, handleQueueClick }) => {
  // Helper function to determine status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "success";
      case "closed":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ flexGrow: 1, mt: 2 }}>
      <Grid container spacing={2}>
        {queues.map((queue) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={queue.metadata.name}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleQueueClick(queue)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" component="div" noWrap>
                    {queue.metadata.name}
                  </Typography>
                  <Chip 
                    label={queue.status?.state || "Unknown"} 
                    size="small" 
                    color={getStatusColor(queue.status?.state)}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Namespace: {queue.metadata.namespace || "default"}
                </Typography>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Typography variant="subtitle2">
                  Allocated Resources:
                </Typography>
                
                <Box mt={1}>
                  <Typography variant="body2">
                    CPU: {queue.status?.allocated?.cpu || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    Memory: {queue.status?.allocated?.memory || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    Pods: {queue.status?.allocated?.pods || "N/A"}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(queue.metadata.creationTimestamp).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QueueGridView;