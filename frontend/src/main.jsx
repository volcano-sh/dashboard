import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClusterProvider } from "./config/ClusterContext";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ClusterProvider>
            <App />
        </ClusterProvider>
    </StrictMode>,
);
