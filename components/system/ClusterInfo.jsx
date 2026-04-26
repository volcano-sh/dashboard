"use client";

import React from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Divider,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from "@mui/material";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { useQuery } from "@tanstack/react-query";
import { fetchClusterInfo } from "../../lib/client/dashboard-api";

const tableSx = {
    "& .MuiTableCell-root": {
        borderColor: "#e6e8eb",
        fontSize: 13,
        py: 0.8,
    },
};

const valueOrDash = (value) => {
    if (value === undefined || value === null || value === "") return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
};

const sections = [
    {
        key: "connection",
        title: "Cluster Connection",
        icon: <HubOutlinedIcon sx={{ fontSize: 20 }} />,
        rows: [
            ["Mode", "mode"],
            ["Cluster", "cluster"],
            ["API Server", "server"],
            ["Current Context", "currentContext"],
            ["Default Namespace", "namespace"],
            ["User", "user"],
        ],
    },
    {
        key: "schedulerConfig",
        title: "Scheduler Config Source",
        icon: <DnsOutlinedIcon sx={{ fontSize: 20 }} />,
        rows: [
            ["Namespace", "namespace"],
            ["ConfigMap", "name"],
            ["Key", "key"],
        ],
    },
];

export default function ClusterInfo() {
    const { data, error, isLoading, isFetching } = useQuery({
        queryKey: ["cluster", "info"],
        queryFn: fetchClusterInfo,
    });

    const loading = isLoading || isFetching;
    const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

    return (
        <Box
            sx={{ bgcolor: "#f7f8fa", minHeight: "calc(100vh - 64px)", p: 0.5 }}
        >
            <Card sx={{ border: "1px solid #dfe3e8", boxShadow: "none" }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        component="h1"
                        sx={{ fontSize: 22, fontWeight: 700 }}
                    >
                        Cluster Information
                    </Typography>
                    <Typography
                        color="text.secondary"
                        sx={{ fontSize: 13, mt: 0.5 }}
                    >
                        Read-only details about the current Kubernetes
                        connection and scheduler config source.
                    </Typography>
                    <Divider sx={{ my: 2.5 }} />
                    {loading && <LinearProgress sx={{ mb: 2 }} />}
                    {errorMessage && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Failed to load cluster information: {errorMessage}
                        </Alert>
                    )}
                    <Box
                        sx={{
                            display: "grid",
                            gap: 2,
                            gridTemplateColumns: {
                                xs: "1fr",
                                xl: "repeat(3, 1fr)",
                            },
                        }}
                    >
                        {sections.map((section) => (
                            <Box
                                key={section.key}
                                sx={{
                                    border: "1px solid #e1e4e8",
                                    borderRadius: 1,
                                    p: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        alignItems: "center",
                                        display: "flex",
                                        gap: 1,
                                        mb: 1.25,
                                    }}
                                >
                                    {section.icon}
                                    <Typography
                                        sx={{ fontSize: 16, fontWeight: 700 }}
                                    >
                                        {section.title}
                                    </Typography>
                                </Box>
                                <TableContainer
                                    sx={{
                                        border: "1px solid #e6e8eb",
                                        borderRadius: 1,
                                    }}
                                >
                                    <Table size="small" sx={tableSx}>
                                        <TableBody>
                                            {section.rows.map(
                                                ([label, key]) => (
                                                    <TableRow key={label}>
                                                        <TableCell
                                                            sx={{
                                                                color: "text.secondary",
                                                                width: "42%",
                                                            }}
                                                        >
                                                            {label}
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontFamily:
                                                                    key ===
                                                                        "server" ||
                                                                    key ===
                                                                        "certificateAuthority"
                                                                        ? "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace"
                                                                        : "inherit",
                                                            }}
                                                        >
                                                            {valueOrDash(
                                                                data?.[
                                                                    section.key
                                                                ]?.[key],
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
