import express from "express";
import * as queuesController from "../controllers/queuesController.js";

const router = express.Router();

// Queues routes
router.get("/queues/:name", queuesController.getQueueByName);
router.get("/queue/:name/yaml", queuesController.getQueueYaml);
router.get("/queues", queuesController.getQueues);
router.get("/all-queues", queuesController.getAllQueues);

export default router;