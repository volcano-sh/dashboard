import React from "react";
import { useTranslation } from "react-i18next";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const handleChange = (event, newLang) => {
        if (newLang !== null) {
            i18n.changeLanguage(newLang);
        }
    };

    return (
        <ToggleButtonGroup
            value={i18n.language?.startsWith("zh") ? "zh" : "en"}
            exclusive
            onChange={handleChange}
            size="small"
            sx={{
                "& .MuiToggleButton-root": {
                    color: "rgba(255, 255, 255, 0.7)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    padding: "2px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    "&.Mui-selected": {
                        color: "#fff",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.25)",
                        },
                    },
                    "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                },
            }}
        >
            <ToggleButton value="en" aria-label="English">
                EN
            </ToggleButton>
            <ToggleButton value="zh" aria-label="中文">
                中文
            </ToggleButton>
        </ToggleButtonGroup>
    );
};

export default LanguageSwitcher;
