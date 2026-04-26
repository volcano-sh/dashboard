"use client";

import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../../components/auth/AuthProvider";

export default function SsoCompletePage() {
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const token = params.get("token");
        if (!token) {
            window.location.replace(
                "/login?error=SSO login did not return a token.",
            );
            return;
        }
        loginWithToken(token, false);
    }, [loginWithToken]);

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
