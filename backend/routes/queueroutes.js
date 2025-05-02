import express from "express";
import { getAllQueues, getQueueDetails, getQueueYaml } from "../controllers/queuecontroller.js";

const router = express.Router();

// Route to get all queues with pagination
router.get("/", getAllQueues);

// Route to get details of a specific queue
router.get("/:name", getQueueDetails);

// Route to get YAML of a specific queue
router.get("/:name/yaml", getQueueYaml);





export default router;
