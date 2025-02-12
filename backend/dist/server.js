import express from "express";
import cors from "cors";
import { podRoutes } from "./routes/podroutes.js";
import queueRoutes from "./routes/queueroutes.js"
import jobRoutes from './routes/jobroutes.js';
import withoutPaginationRoutes from "./routes/withoutPaginationRoutes.js"


const app = express();
app.use(cors({ origin: "*" }));

// Register the pod routes
app.use("/api/pods", podRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/without", withoutPaginationRoutes);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
