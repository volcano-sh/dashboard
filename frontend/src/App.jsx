import React, { useState } from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import Layout, { ErrorContext } from "./components/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Jobs from "./components/jobs/Jobs";
import Queues from "./components/queues/Queues";
import Pods from "./components/pods/Pods";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

let backendUnavailable = false;
let consecutiveFailures = 0;
const MAX_FAILURES = 3;

axios.interceptors.response.use(
    (response) => {
        consecutiveFailures = 0;
        backendUnavailable = false;
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 500) {
            consecutiveFailures++;
            
            if (consecutiveFailures >= MAX_FAILURES) {
                backendUnavailable = true;
                console.warn(`Backend unavailable after ${MAX_FAILURES} consecutive failures`);
            }
            
            console.error("Server error detected:", error.response.data);
        }
        return Promise.reject(error);
    }
);

export const isBackendAvailable = () => !backendUnavailable;
export const resetBackendStatus = () => {
    backendUnavailable = false;
    consecutiveFailures = 0;
};

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