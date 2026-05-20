"use client";

import Link from "next/link";
import {
    Box,
    IconButton,
    Link as MuiLink,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const ReadOnlyModeBanner = ({
    learnMoreHref = "/documentation",
    onClose,
    open = true,
}) => {
    if (!open) return null;

    return (
        <Box
            role="status"
            sx={{
                alignItems: "center",
                bgcolor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "6px",
                color: "#0f172a",
                display: "flex",
                gap: 1.5,
                mb: 2.5,
                minHeight: 48,
                px: 2,
                py: { xs: 1.25, sm: 1 },
            }}
        >
            <Box
                sx={{
                    alignItems: "center",
                    border: "1px solid #60a5fa",
                    borderRadius: "50%",
                    color: "#2563eb",
                    display: "inline-flex",
                    flex: "0 0 auto",
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                }}
            >
                <LockOutlinedIcon sx={{ fontSize: 17 }} />
            </Box>
            <Typography
                sx={{
                    flex: "0 0 auto",
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                }}
            >
                Read-only mode
            </Typography>
            <Box
                sx={{
                    alignSelf: "stretch",
                    borderLeft: "1px solid #94a3b8",
                    display: { xs: "none", sm: "block" },
                    my: 0.75,
                }}
            />
            <Typography sx={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                You can view resources, but create, update, and delete actions
                are disabled.
            </Typography>
            <MuiLink
                component={Link}
                href={learnMoreHref}
                sx={{
                    alignItems: "center",
                    color: "#1d4ed8",
                    display: { xs: "none", sm: "inline-flex" },
                    flex: "0 0 auto",
                    fontSize: 13,
                    fontWeight: 600,
                    gap: 0.5,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                }}
            >
                Learn more
                <OpenInNewIcon sx={{ fontSize: 14 }} />
            </MuiLink>
            <IconButton
                aria-label="Dismiss read-only mode banner"
                onClick={onClose}
                size="small"
                sx={{ color: "#1d4ed8", flex: "0 0 auto" }}
            >
                <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
        </Box>
    );
};

export default ReadOnlyModeBanner;
