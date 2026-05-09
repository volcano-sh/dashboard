import React from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TitleComponent from "../Titlecomponent";

const DashboardHeader = ({ onRefresh, refreshing }) => {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
            }}
        >
            <TitleComponent text={t("dashboard.title")} />
            <Tooltip title={t("dashboard.refreshTooltip")}>
                <IconButton onClick={onRefresh} disabled={refreshing}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default DashboardHeader;
