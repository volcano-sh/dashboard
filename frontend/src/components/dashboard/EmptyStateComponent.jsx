import React from "react";
import { Box, Typography } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";

const EmptyStateComponent = ({ 
  title = "No data available", 
  message = "There are currently no items to display.", 
  icon = <AssignmentIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        p: 3
      }}
    >
      {icon}
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        {message}
      </Typography>
    </Box>
  );
};

export default EmptyStateComponent;