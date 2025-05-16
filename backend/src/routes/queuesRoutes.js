import express from "express";
import * as queuesController from "../controllers/queuesController.js";

const router = express.Router();

// Configure express to parse JSON
router.use(express.json());

// Queues routes
router.get("/queues/:name", queuesController.getQueueByName);
router.get("/queue/:name/yaml", queuesController.getQueueYaml);
router.get("/queues", queuesController.getQueues);
router.get("/all-queues", queuesController.getAllQueues);

// New route for updating queues
router.put("/queue/:name", queuesController.updateQueue);

export default router;