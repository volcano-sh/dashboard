import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Jobs from "./components/jobs/Jobs";
import Queues from "./components/queues/Queues";
import Pods from "./components/pods/Pods";
import PodGroups from "./components/podgroups/PodGroups";

import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";

import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    return (
        <GlobalErrorBoundary>
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
                            <Route path="podgroups" element={<PodGroups />} />
                        </Route>
                    </Routes>
                </Router>
            </ThemeProvider>
        </GlobalErrorBoundary>
    );
}

export default App;
