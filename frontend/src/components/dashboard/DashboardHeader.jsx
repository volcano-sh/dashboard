import React from "react";
import { Box, IconButton, Tooltip, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TranslateIcon from "@mui/icons-material/Translate";
import { useTranslation } from "react-i18next";
import TitleComponent from "../Titlecomponent";

const DashboardHeader = ({ onRefresh, refreshing }) => {
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const nextLang = i18n.language.startsWith("zh") ? "en" : "zh";
        i18n.changeLanguage(nextLang);
    };

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<TranslateIcon />}
                    onClick={toggleLanguage}
                    sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        color: "text.secondary",
                        borderColor: "divider",
                        "&:hover": {
                            borderColor: "primary.main",
                        },
                    }}
                >
                    {i18n.language.startsWith("zh") ? "中 / EN" : "EN / 中"}
                </Button>
                <Tooltip title={t("dashboard.refresh")}>
                    <IconButton onClick={onRefresh} disabled={refreshing}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default DashboardHeader;
