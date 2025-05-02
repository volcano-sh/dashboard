import {
    getQueues,
    getQueueById,
    getQueueYaml,
    getAllQueues,
} from "../controllers/queueController.js";

export const queueRoutes = (app) => {
    app.get("/api/queues", getQueues);
    app.get("/api/queues/:name", getQueueById);
    app.get("/api/queue/:name/yaml", getQueueYaml);
    app.get("/api/all-queues", getAllQueues);
};
