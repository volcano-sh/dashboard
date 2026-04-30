"use client";

import React from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }) {
    const auth = useAuth();

    if (auth?.authError) {
        return (
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    minHeight: "100vh",
                    justifyContent: "center",
                    p: 3,
                }}
            >
                <Alert severity="error" sx={{ maxWidth: 520 }}>
                    {auth.authError}
                </Alert>
            </Box>
        );
    }

    if (auth?.loading || !auth?.canRead) {
        return (
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    minHeight: "100vh",
                    justifyContent: "center",
                }}
            >
                <CircularProgress size={24} />
            </Box>
        );
    }

    return children;
}
