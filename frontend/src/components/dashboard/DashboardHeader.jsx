import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TitleComponent from "../Titlecomponent";
import { translations } from "../../config/translations";

const DashboardHeader = ({ onRefresh, refreshing }) => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
            }}
        >
            <TitleComponent text={translations.zh.volcanoDashboard} />
            <Tooltip title="Refresh Data">
                <IconButton onClick={onRefresh} disabled={refreshing}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default DashboardHeader;
