import express from "express";
import cors from "cors";

// Initialize Express app
export const app = express();
app.use(cors({ origin: "*" }));

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