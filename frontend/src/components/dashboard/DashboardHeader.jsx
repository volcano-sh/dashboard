import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TitleComponent from "../Titlecomponent";
import {useTranslation} from "react-i18next";

const DashboardHeader = ({ onRefresh, refreshing }) => {

    const {t} = useTranslation();

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
            <Tooltip title={t("dashboard.refreshData")}>
                <IconButton onClick={onRefresh} disabled={refreshing}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default DashboardHeader;
