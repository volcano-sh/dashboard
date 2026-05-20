import { createTheme } from "@mui/material/styles";

// Matches the main color of volcano
export const volcanoOrange = "#E34C26";

export const theme = createTheme({
    palette: {
        primary: {
            main: volcanoOrange,
            contrastText: "#fff", // make sure the button text is white
            dark: "#B33D1F", // color on hover
            light: "#E86C47", // lighter variant
        },
    },
});
