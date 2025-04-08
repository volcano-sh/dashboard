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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Queues from "./components/queues/Queues";
import Pods from "./components/pods/Pods";
import { httpBatchLink, httpLink, splitLink } from "@trpc/react-query";

import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import "bootstrap/dist/css/bootstrap.min.css";

import SuperJSON from "superjson";

import { trpc } from "./utils/trpc";

function App() {
    const [queryClient] = useState(() => new QueryClient());

    const [trpcClient] = useState(() =>
        trpc.createClient({
            transformer: SuperJSON,
            links: [
                splitLink({
                    condition: (op) => op.context.skipBatch === true,
                    true: httpLink({
                        url: `http://localhost:3001/api`,
                    }),
                    false: httpBatchLink({
                        url: `http://localhost:3001/api`,
                    }),
                }),
            ],
        }),
    );
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <Router>
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route
                                    index
                                    element={
                                        <Navigate to="/dashboard" replace />
                                    }
                                />
                                <Route
                                    path="dashboard"
                                    element={<Dashboard />}
                                />
                                <Route path="jobs" element={<Jobs />} />
                                <Route path="queues" element={<Queues />} />
                                <Route path="pods" element={<Pods />} />
                            </Route>
                        </Routes>
                    </Router>
                </ThemeProvider>
            </QueryClientProvider>
        </trpc.Provider>
    );
}

export default App;
