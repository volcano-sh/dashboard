import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Jobs from "./components/Jobs";
import Queues from "./components/Queues";
import Pods from "./components/Pods";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme"; // import theme

function App() {
    return (
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
    );
}

export default App;
