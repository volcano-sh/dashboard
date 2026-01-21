import { createTheme } from "@mui/material/styles";

// Matches the main color of volcano
export const volcanoOrange = "#E34C26";
export const headerGrey = "#424242";

export const theme = createTheme({
    palette: {
        primary: {
            main: volcanoOrange,
            contrastText: "#fff",
            dark: "#B33D1F",
            light: "#E86C47",
        },
        secondary: {
            main: "#424242",
            light: "#6d6d6d",
            dark: "#1b1b1b",
            contrastText: "#fff"
        },
        background: {
            default: "#f8f9fa",
            paper: "#ffffff"
        },
        error: {
            main: "#f44336",
        },
        warning: {
            main: "#ff9800",
        },
        success: {
            main: "#4caf50",
        },
        info: {
            main: "#2196f3",
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 500,
            fontSize: "2rem",
        },
        h2: {
            fontWeight: 500,
            fontSize: "1.75rem",
        },
        h3: {
            fontWeight: 500,
            fontSize: "1.5rem",
        },
        h4: {
            fontWeight: 500,
            fontSize: "1.25rem",
        },
        h5: {
            fontWeight: 500,
            fontSize: "1rem",
        },
        h6: {
            fontWeight: 500,
            fontSize: "0.875rem",
        },
        button: {
            textTransform: "none",
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    padding: "6px 16px",
                },
                containedPrimary: {
                    "&:hover": {
                        backgroundColor: "#B33D1F",
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: "#f5f5f5",
                    fontWeight: 600,
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#f5f5f5",
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: headerGrey,
                },
            },
        },
    },
});
