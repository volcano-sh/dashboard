import express from "express";
import cors from "cors";
import { jobRouter, namespaceRouter, podRouter, queueRouter } from "./routes/index.js";

const app = express();
app.use(cors({ origin: '*' }));

app.use("/api", jobRouter);
app.use("/api", namespaceRouter);
app.use("/api", podRouter);
app.use("/api", queueRouter);

export default app;