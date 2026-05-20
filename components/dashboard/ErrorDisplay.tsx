import React from "react";
import { Paper, Typography } from "@mui/material";

const ErrorDisplay = ({ message }) => {
    return (
        <Paper
            sx={{
                p: 2,
                mb: 2,
                bgcolor: "error.light",
                color: "error.contrastText",
            }}
        >
            <Typography>{message}</Typography>
        </Paper>
    );
};

export default ErrorDisplay;
