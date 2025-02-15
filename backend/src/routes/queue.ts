import express from "express";
import { getAllQueues, getQueueByName, getQueueYamlByName, getQueues } from "../controllers/queue.js";

const router = express.Router();

router.get("/all-queues", getAllQueues);
router.get("/queues/:name", getQueueByName);
router.get("/queue/:name/yaml", getQueueYamlByName);
router.get("/queues", getQueues);

export default router;
