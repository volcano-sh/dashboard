import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service here
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        bgcolor: "grey.50",
                        p: 3,
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 5,
                            maxWidth: 500,
                            textAlign: "center",
                            borderRadius: 2,
                        }}
                    >
                        <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                            Something went wrong
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            The dashboard encountered an unexpected error. This might be due to a temporary network issue or invalid data from the cluster.
                        </Typography>
                        
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={this.handleReset}
                            sx={{ textTransform: "none", px: 4, py: 1 }}
                        >
                            Reload Dashboard
                        </Button>
                        
                        {process.env.NODE_ENV === "development" && (
                            <Box sx={{ mt: 4, textAlign: "left" }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, display: 'block', borderRadius: 1, color: 'error.dark' }}>
                                    {this.state.error && this.state.error.toString()}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
