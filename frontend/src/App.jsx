import React, { useState, useMemo, useEffect } from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Layout from "./components/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Jobs from "./components/jobs/Jobs";
import Queues from "./components/queues/Queues";
import Pods from "./components/pods/Pods";
import { createAppTheme } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";

export const ColorModeContext = React.createContext({
    toggleColorMode: () => {},
});

function App() {
    const getInitialMode = () => {
        const savedMode = localStorage.getItem("theme-mode");
        if (savedMode) {
            return savedMode;
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    };

    const [mode, setMode] = useState(getInitialMode);

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === "light" ? "dark" : "light";
                    localStorage.setItem("theme-mode", newMode);
                    return newMode;
                });
            },
        }),
        [],
    );

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e) => {
            if (!localStorage.getItem("theme-mode")) {
                setMode(e.matches ? "dark" : "light");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <Router>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route
                                index
                                element={<Navigate to="/dashboard" replace />}
                            />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="jobs" element={<Jobs />} />
                            <Route path="queues" element={<Queues />} />
                            <Route path="pods" element={<Pods />} />
                        </Route>
                    </Routes>
                </Router>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
