import { createTheme } from "@mui/material/styles";

// Matches the main color of volcano
export const volcanoOrange = "#E34C26";

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        primary: {
            main: volcanoOrange,
            contrastText: "#fff", // make sure the button text is white
            dark: "#B33D1F", // color on hover
            light: "#E86C47", // lighter variant
        },
        background: {
            default: mode === "dark" ? "#121212" : "#f5f5f5",
            paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
        },
        text: {
            primary: mode === "dark" ? "#ffffff" : "#000000",
            secondary: mode === "dark" ? "#b3b3b3" : "#666666",
        },
        divider:
            mode === "dark"
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.12)",
       
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom:
                        mode === "dark"
                            ? "1px solid rgba(255, 255, 255, 0.12)"
                            : "1px solid rgba(0, 0, 0, 0.12)",
                },
            },
        },
    },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
