import React, { useState } from "react";
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
import Scheduler from "./components/scheduler/Scheduler";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";

import { LanguageContext } from "./contexts/LanguageContext";

function App() {
    const [lang, setLang] = useState("en");

    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
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
                            <Route path="scheduler" element={<Scheduler />} />
                        </Route>
                    </Routes>
                </Router>
            </ThemeProvider>
        </LanguageContext.Provider>
    );
}

export default App;
