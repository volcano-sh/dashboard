import React from "react";
import { IconButton, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    position: "relative",
    overflow: "hidden",
    borderRadius: "50%",
    transition: "all 0.3s ease-in-out",
    "&:hover": {
        backgroundColor:
            theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.08)",
        transform: "scale(1.1)",
    },
    "& svg": {
        transition: "transform 0.3s ease-in-out, opacity 0.2s ease-in-out",
    },
    "&:hover svg": {
        transform: "rotate(180deg)",
    },
}));

const ThemeToggle = ({ onToggle }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <StyledIconButton
            onClick={onToggle}
            color="inherit"
            aria-label="toggle theme"
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            {isDark ? (
                <Brightness7Icon sx={{ color: "primary.light" }} />
            ) : (
                <Brightness4Icon sx={{ color: "primary.main" }} />
            )}
        </StyledIconButton>
    );
};

export default ThemeToggle;
