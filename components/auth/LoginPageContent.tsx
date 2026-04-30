"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "../../lib/client/dashboard-api";
import { useAuth } from "./AuthProvider";

const authErrorText = "Invalid username or password. Please try again.";

function LoginPageContentInner() {
    const auth = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(searchParams.get("error") || "");

    const ssoEnabled = auth?.authConfig?.ssoEnabled;
    const providerName = auth?.authConfig?.providerName || "SSO";

    useEffect(() => {
        if (!auth?.loading && auth?.authConfig?.accessMode === "read-only") {
            router.replace("/dashboard");
        }
    }, [auth?.authConfig?.accessMode, auth?.loading, router]);

    useEffect(() => {
        const nextError = searchParams.get("error");
        if (nextError) setError(nextError);
    }, [searchParams]);

    const footerYear = useMemo(() => new Date().getFullYear(), []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const response = await axios.post(`${API_BASE}/auth/local`, {
                password,
                remember,
                username,
            });
            await auth.loginWithToken(response.data.token, remember);
        } catch (err) {
            setError(err?.response?.data?.message || authErrorText);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSso = () => {
        window.location.assign(`${API_BASE}/auth/sso/start`);
    };

    return (
        <Box
            sx={{
                bgcolor: "#f8fafc",
                color: "#1f2933",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                minHeight: "100vh",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <Snackbar
                anchorOrigin={{ horizontal: "right", vertical: "top" }}
                open={Boolean(error)}
                onClose={() => setError("")}
            >
                <Alert
                    icon={false}
                    severity="error"
                    action={
                        <IconButton
                            color="inherit"
                            onClick={() => setError("")}
                            size="small"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                    sx={{
                        alignItems: "flex-start",
                        bgcolor: "#fff7f6",
                        border: "1px solid #ff6b57",
                        boxShadow: "0 12px 28px rgba(227, 76, 38, 0.12)",
                        minWidth: 360,
                    }}
                >
                    <Typography sx={{ fontWeight: 700, mb: 0.25 }}>
                        Login failed
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                        {error}
                    </Typography>
                </Alert>
            </Snackbar>

            <Box
                sx={{
                    alignItems: "center",
                    display: { xs: "none", md: "flex" },
                    justifyContent: "center",
                    minHeight: "100vh",
                    overflow: "hidden",
                    position: "relative",
                    px: 8,
                }}
            >
                <Box
                    sx={{
                        background:
                            "radial-gradient(circle at 50% 56%, rgba(227,76,38,0.12), transparent 26%), linear-gradient(180deg, transparent 58%, rgba(226,232,240,0.7) 59%, rgba(248,250,252,0.4) 100%)",
                        inset: 0,
                        position: "absolute",
                    }}
                />
                <Box
                    sx={{
                        bottom: 0,
                        height: 260,
                        left: 0,
                        opacity: 0.82,
                        position: "absolute",
                        right: 0,
                        "&:before": {
                            background:
                                "linear-gradient(140deg, transparent 0 20%, #e5e7eb 21% 42%, transparent 43%), linear-gradient(35deg, transparent 0 48%, #d1d5db 49% 70%, transparent 71%)",
                            content: '""',
                            filter: "blur(0.2px)",
                            inset: 0,
                            position: "absolute",
                        },
                    }}
                />
                <Box
                    sx={{
                        position: "relative",
                        textAlign: "center",
                        transform: "translateY(-40px)",
                        zIndex: 1,
                    }}
                >
                    <Box
                        component="img"
                        src="/volcano-icon-color.svg"
                        alt="Volcano"
                        sx={{ height: 96, mb: 2 }}
                    />
                    <Typography
                        component="h1"
                        sx={{ fontSize: 36, fontWeight: 800, mb: 1 }}
                    >
                        Volcano Dashboard
                    </Typography>
                    <Typography
                        sx={{
                            color: "text.secondary",
                            fontSize: 17,
                            lineHeight: 1.55,
                            maxWidth: 420,
                        }}
                    >
                        Intelligent scheduling and resource management for your
                        workloads.
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    alignItems: "center",
                    bgcolor: "#ffffff",
                    display: "flex",
                    justifyContent: "center",
                    minHeight: "100vh",
                    px: { xs: 3, md: 8 },
                    position: "relative",
                }}
            >
                <Box component="form" onSubmit={handleSubmit} sx={{ width: 520 }}>
                    <Typography
                        component="h2"
                        sx={{ fontSize: 30, fontWeight: 800, mb: 0.75 }}
                    >
                        Welcome back
                    </Typography>
                    <Typography
                        sx={{ color: "text.secondary", fontSize: 16, mb: 6 }}
                    >
                        Sign in to continue to Volcano Dashboard
                    </Typography>

                    <Typography sx={{ fontSize: 14, mb: 1 }}>
                        Username
                    </Typography>
                    <TextField
                        fullWidth
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Enter your username"
                        required
                        value={username}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonOutlineIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    <Typography sx={{ fontSize: 14, mb: 1 }}>
                        Password
                    </Typography>
                    <TextField
                        fullWidth
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={() =>
                                            setShowPassword((value) => !value)
                                        }
                                    >
                                        {showPassword ? (
                                            <VisibilityOutlinedIcon fontSize="small" />
                                        ) : (
                                            <VisibilityOffOutlinedIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlinedIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Box
                        sx={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 4,
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={remember}
                                    onChange={(event) =>
                                        setRemember(event.target.checked)
                                    }
                                />
                            }
                            label="Remember me"
                        />
                        <Button sx={{ textTransform: "none" }} variant="text">
                            Forgot password?
                        </Button>
                    </Box>

                    <Button
                        disabled={submitting}
                        fullWidth
                        size="large"
                        sx={{
                            bgcolor: "#ff4d2d",
                            boxShadow: "0 12px 24px rgba(255,77,45,0.18)",
                            fontWeight: 700,
                            mb: ssoEnabled ? 3.5 : 0,
                            py: 1.4,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#e84325" },
                        }}
                        type="submit"
                        variant="contained"
                    >
                        Sign In
                    </Button>

                    {ssoEnabled && (
                        <>
                            <Box
                                sx={{
                                    alignItems: "center",
                                    color: "text.secondary",
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: "1fr auto 1fr",
                                    mb: 3,
                                }}
                            >
                                <Box sx={{ borderTop: "1px solid #d9dee6" }} />
                                <Typography>OR</Typography>
                                <Box sx={{ borderTop: "1px solid #d9dee6" }} />
                            </Box>
                            <Button
                                fullWidth
                                onClick={handleSso}
                                size="large"
                                startIcon={<ShieldOutlinedIcon />}
                                sx={{
                                    borderColor: "#c7ced8",
                                    color: "text.primary",
                                    fontWeight: 600,
                                    py: 1.25,
                                    textTransform: "none",
                                }}
                                variant="outlined"
                            >
                                Continue with {providerName}
                            </Button>
                        </>
                    )}
                </Box>

                <Box
                    sx={{
                        bottom: 28,
                        color: "text.secondary",
                        display: "flex",
                        fontSize: 13,
                        gap: 10,
                        position: "absolute",
                    }}
                >
                    <span>
                        © {footerYear} Volcano Authors. All rights reserved.
                    </span>
                    <span>v1.0.0</span>
                </Box>
            </Box>
        </Box>
    );
}

export default function LoginPageContent() {
    return (
        <Suspense fallback={null}>
            <LoginPageContentInner />
        </Suspense>
    );
}
