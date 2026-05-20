import React from "react";
import { type SxProps, type Theme } from "@mui/material";
import SchedulingStatusChip from "../scheduling/SchedulingStatusChip";

type JobStatusChipProps = {
    minWidth?: number;
    size?: "small" | "medium";
    status?: string;
    sx?: SxProps<Theme>;
};

const JobStatusChip = ({
    minWidth = 86,
    size = "medium",
    status,
    sx,
}: JobStatusChipProps) => (
    <SchedulingStatusChip
        minWidth={minWidth}
        size={size}
        status={status}
        sx={sx}
    />
);

export default JobStatusChip;
