import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TitleComponent from "../Titlecomponent";

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
            <TitleComponent text="Volcano 仪表板" />
            <Tooltip title="刷新数据">
                <IconButton onClick={onRefresh} disabled={refreshing}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default DashboardHeader;
