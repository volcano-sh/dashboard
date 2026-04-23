import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import Configuration from "./components/configuration/Configuration";
import Settings from "./components/system/Settings";
import Documentation from "./components/system/Documentation";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 15000,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
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
                            <Route
                                path="configuration"
                                element={<Configuration />}
                            />
                            <Route path="settings" element={<Settings />} />
                            <Route
                                path="documentation"
                                element={<Documentation />}
                            />
                        </Route>
                    </Routes>
                </Router>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
