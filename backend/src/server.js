import express from "express";
import cors from "cors";
import jobRoutes from "./routes/jobRoutes.js";
import podRoutes from "./routes/podRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import namespaceRoutes from "./routes/namespaceRoutes.js";
import podGroupRoutes from "./routes/podGroupRoutes.js";
import { contextMiddleware } from "./middleware/contextMiddleware.js";
import { WebSocketServer } from "ws";
import terminalService from "./services/terminalService.js";
import url from "url";

export const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(contextMiddleware);

// API Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/job", jobRoutes); // For singular /api/job/.../yaml
app.use("/api/pods", podRoutes);
app.use("/api/pod", podRoutes); // For singular /api/pod/.../yaml
app.use("/api/queues", queueRoutes);
app.use("/api/queue", queueRoutes); // For singular /api/queue/.../yaml
app.use("/api/namespaces", namespaceRoutes);
app.use("/api/podgroups", podGroupRoutes);

// Compatibility / Special Routes
import k8sService from "./services/k8sService.js";
import clusterService from "./services/clusterService.js";

app.get("/api/v1/clusters", async (req, res) => {
    try {
        const clusters = await clusterService.listClusters();
        res.json(clusters);
    } catch (error) {
        res.status(500).json({ error: "Failed to list clusters" });
    }
});

app.get("/api/all-jobs", async (req, res) => {
    try {
        const result = await k8sService.listJobs(req.clusterContext, "", "", "", "");
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch all jobs" });
    }
});

app.get("/api/all-queues", async (req, res) => {
    try {
        const result = await k8sService.listQueues(req.clusterContext, 1, 1000, "", "");
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch all queues" });
    }
});

app.get("/api/all-pods", async (req, res) => {
    try {
        const result = await k8sService.listPods(req.clusterContext, "", "", "");
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch all pods" });
    }
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/api/v1/terminal") {
        const { context, namespace, pod, container } = parsedUrl.query;
        terminalService.setupTerminal(ws, context, namespace, pod, container);
    } else {
        ws.close();
    }
});
