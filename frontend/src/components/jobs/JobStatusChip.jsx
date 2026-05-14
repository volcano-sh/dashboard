import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Chip, useTheme } from "@mui/material";

const JobStatusChip = ({ status }) => {
    const theme = useTheme();
    const { lang } = useLanguage();
    const zh = lang === "zh";

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

    const statusLabels = zh ? {
        "Running": "运行中",
        "Pending": "等待中",
        "Failed": "失败",
        "Completed": "已完成",
        "Succeeded": "成功",
        "Unknown": "未知",
    } : {};

    return (
        <Chip
            label={statusLabels[status] || status || (zh ? "未知" : "Unknown")}
            sx={{
                bgcolor: getStatusColor(status),
                color: "common.white",
            }}
        />
    );
};

export default JobStatusChip;
