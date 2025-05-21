import React from "react";
import { Chip, Tooltip, useTheme } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LoopIcon from "@mui/icons-material/Loop";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const JobStatusChip = ({ status, error = false, loading = false }) => {
    const theme = useTheme();

    const getStatusConfig = (status) => {
        if (error) {
            return {
                color: theme.palette.error.main,
                icon: <ErrorOutlineIcon fontSize="small" />,
                label: "Error",
                tooltip: "Connection error: Unable to retrieve current status"
            };
        }
        
        if (loading) {
            return {
                color: theme.palette.grey[500],
                icon: <LoopIcon fontSize="small" className="rotating-icon" />,
                label: "Loading",
                tooltip: "Retrieving status information..."
            };
        }
        
        switch (status) {
            case "Failed":
                return {
                    color: theme.palette.error.main,
                    icon: <ErrorOutlineIcon fontSize="small" />,
                    label: "Failed",
                    tooltip: "The job has failed to complete"
                };
            case "Pending":
                return {
                    color: theme.palette.warning.main,
                    icon: <HourglassEmptyIcon fontSize="small" />,
                    label: "Pending",
                    tooltip: "The job is pending execution"
                };
            case "Running":
                return {
                    color: theme.palette.success.main,
                    icon: <LoopIcon fontSize="small" className="rotating-icon" />,
                    label: "Running",
                    tooltip: "The job is currently running"
                };
            case "Completed":
                return {
                    color: theme.palette.info.main,
                    icon: <CheckCircleOutlineIcon fontSize="small" />,
                    label: "Completed",
                    tooltip: "The job has successfully completed"
                };
            default:
                return {
                    color: theme.palette.grey[500],
                    icon: <HelpOutlineIcon fontSize="small" />,
                    label: status || "Unknown",
                    tooltip: "The job status is unknown or not available"
                };
        }
    };

    const { color, icon, label, tooltip } = getStatusConfig(status);

    return (
        <Tooltip title={tooltip} arrow>
            <Chip
                icon={icon}
                label={label}
                sx={{
                    bgcolor: color,
                    color: "common.white",
                    fontWeight: 500,
                    "& .MuiChip-icon": {
                        color: "common.white"
                    },
                    "& .rotating-icon": {
                        animation: "spin 2s linear infinite",
                    },
                    "@keyframes spin": {
                        "0%": {
                            transform: "rotate(0deg)",
                        },
                        "100%": {
                            transform: "rotate(360deg)",
                        },
                    },
                }}
                size="small"
            />
        </Tooltip>
    );
};

export default JobStatusChip;