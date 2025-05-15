import React from "react";
import { Alert, AlertTitle, Box, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

/**
 * Component to display error messages with retry option
 *
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Handler for retry button
 * @param {Object} props.sx - Additional styles
 */
const ErrorDisplay = ({ message, onRetry = null, sx = {} }) => {
    return (
        <Box sx={{ mb: 3, ...sx }}>
            <Alert
                severity="error"
                variant="outlined"
                action={
                    onRetry && (
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={onRetry}
                        >
                            Retry
                        </Button>
                    )
                }
            >
                <AlertTitle>Error</AlertTitle>
                {message}
            </Alert>
        </Box>
    );
};

export default ErrorDisplay;
