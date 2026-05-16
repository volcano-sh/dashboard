import { Chip, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

const JobStatusChip = ({ status }) => {
    const { t } = useTranslation();
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
            label={status ? t(status.toLowerCase()) : t("unknown")}
            sx={{
                bgcolor: getStatusColor(status),
                color: "common.white",
            }}
        />
    );
};

export default JobStatusChip;
