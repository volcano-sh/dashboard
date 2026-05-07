import React from "react";
import { Chip, useTheme } from "@mui/material";
import { useTranslation } from "../../i18n/I18nProvider";

const JobStatusChip = ({ status }) => {
    const theme = useTheme();
    const { tStatus } = useTranslation();

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
            label={tStatus(status)}
            sx={{
                bgcolor: getStatusColor(status),
                color: "common.white",
            }}
        />
    );
};

export default JobStatusChip;
