import React from "react";
import { Paper, Typography, Button, Stack } from "@mui/material";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

const ErrorDisplay = ({ message, onRetry }) => {
    return (
        <Paper
            sx={{
                p: 2,
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "error.light",
                color: "error.contrastText",
                borderLeft: "5px solid red",
                boxShadow: 2,
            }}
        >
    
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
             <ReportProblemIcon sx={{ color: '#ffb74d' }} fontSize="medium" />
               {message}
            </Typography>
            {onRetry && (
                <Button
                 variant="contained"
                size="small"
                sx={{
                ml: 2,
                minWidth: "80px",
                fontWeight: 600,
                bgcolor: "#d32f2f", 
                color: "#fff",
                '&:hover': {
               bgcolor: "#b71c1c", 
                },
                textTransform: 'none',
                boxShadow: 1,
                borderRadius: '6px',
                }}
                onClick={onRetry}
                >
                Retry
                </Button>

            )}
        </Paper>
    );
};

export default ErrorDisplay;
