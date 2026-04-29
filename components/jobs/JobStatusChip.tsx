import React from "react";
import { Chip, type SxProps, type Theme, useTheme } from "@mui/material";

type JobStatusChipProps = {
    status?: string;
    sx?: SxProps<Theme>;
};

const JobStatusChip = ({ status, sx }: JobStatusChipProps) => {
    const theme = useTheme();

    const getStatusColor = (status) => {
        switch (status) {
            case "Failed":
                return theme.palette.error.main;
            case "Pending":
                return theme.palette.warning.main;
            case "Running":
                return theme.palette.success.main;
            case "Completed":
                return theme.palette.info.main;
            default:
                return theme.palette.grey[500];
        }
    };

    return (
        <Chip
            label={status || "Unknown"}
            sx={{
                bgcolor: getStatusColor(status),
                color: "common.white",
                ...sx,
            }}
        />
    );
};

export default JobStatusChip;
