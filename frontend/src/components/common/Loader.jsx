import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Reusable loading component that displays a centered circular progress indicator
 * @param {Object} props - Component props
 * @param {string} props.message - Optional message to display below the spinner
 * @param {boolean} props.showMessage - Whether to show the message
 * @param {Object} props.sx - Optional additional styles
 * @param {number} props.size - Size of the CircularProgress (default: 40)
 * @param {string} props.color - Color of the CircularProgress (default: 'primary')
 * @param {string} props.variant - Variant of the loader (default: 'circular', options: 'circular', 'inline')
 * @param {boolean} props.fullHeight - Whether to take full height of parent container
 */
const Loader = ({
    message = null,
    showMessage = false,
    sx = {},
    size = 40,
    color = "primary",
    variant = "circular",
    fullHeight = true,
}) => {
    const isInline = variant === "inline";

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: fullHeight ? "100%" : "auto",
                width: "100%",
                ...(isInline && { flexDirection: "row", py: 1 }),
                ...sx,
            }}
        >
            <CircularProgress size={size} color={color} />
            {showMessage && message && (
                <Typography
                    variant="body2"
                    sx={{
                        mt: isInline ? 0 : 2,
                        ml: isInline ? 2 : 0,
                        color: "text.secondary",
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default Loader;
