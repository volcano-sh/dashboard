import express from "express";
import cors from "cors";

// Initialize Express app
export const app = express();
app.use(cors({ origin: "*" }));

// Configure JSON parsing middleware BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import jobsRoutes from "./routes/jobsRoutes.js";
import queuesRoutes from "./routes/queuesRoutes.js";
import namespacesRoutes from "./routes/namespacesRoutes.js";
import podsRoutes from "./routes/podsRoutes.js";

// Register routes
app.use("/api", jobsRoutes);
app.use("/api", queuesRoutes);
app.use("/api", namespacesRoutes);
app.use("/api", podsRoutes);

// Add a middleware to log request bodies for debugging
app.use((req, res, next) => {
    if (req.method === 'PUT' || req.method === 'POST') {
        console.log(`[${req.method}] ${req.path} - Request Body:`, req.body);
    }
    next();
});