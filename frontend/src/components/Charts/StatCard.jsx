import React from "react";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import QueuePlayNextIcon from "@mui/icons-material/QueuePlayNext";
import MemoryIcon from "@mui/icons-material/Memory";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

/**
 * Component to display a statistic card with proper loading state
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Title of the statistic
 * @param {string|number} props.value - Value to display
 * @param {string} props.icon - Icon name to display (optional)
 * @param {boolean} props.isLoading - Whether the data is loading
 * @param {string} props.animationVariant - Animation variant for the skeleton (wave or pulse)
 * @param {Object} props.sx - Additional styles
 */
const StatCard = ({
    title,
    value,
    icon = null,
    isLoading = false,
    animationVariant = "wave",
    sx = {},
}) => {
    // Map icon names to components
    const iconMap = {
        WorkOutline: <WorkOutlineIcon />,
        QueuePlay: <QueuePlayNextIcon />,
        Memory: <MemoryIcon />,
        CheckCircleOutline: <CheckCircleOutlineIcon />,
    };

    // Get the icon component if specified
    const IconComponent = icon && iconMap[icon];

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...sx,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                }}
            >
                {isLoading ? (
                    <Skeleton
                        width="60%"
                        height={24}
                        animation={animationVariant}
                    />
                ) : (
                    <Typography variant="subtitle1" color="text.secondary">
                        {title}
                    </Typography>
                )}

                {IconComponent && !isLoading && (
                    <Box sx={{ color: "text.secondary" }}>{IconComponent}</Box>
                )}

                {isLoading && IconComponent && (
                    <Skeleton
                        variant="circular"
                        width={24}
                        height={24}
                        animation={animationVariant}
                    />
                )}
            </Box>

            {isLoading ? (
                <Skeleton
                    width="80%"
                    height={40}
                    animation={animationVariant}
                    sx={{ my: 1 }}
                />
            ) : (
                <Typography
                    variant="h4"
                    component="div"
                    sx={{ fontWeight: "bold", mt: 1 }}
                >
                    {value}
                </Typography>
            )}
        </Paper>
    );
};

export default StatCard;
