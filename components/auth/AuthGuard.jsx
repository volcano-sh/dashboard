"use client";

import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }) {
    const auth = useAuth();

    if (auth?.loading || !auth?.token) {
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
