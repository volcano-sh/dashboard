import express from "express";
import {
    getQueues,
    getQueueDetails,
    getQueueYaml,
    updateQueue,
} from "../controllers/queueController.js";

const router = express.Router();

router.get("/", getQueues);
router.get("/:name", getQueueDetails);
router.get("/:name/yaml", getQueueYaml);
router.patch("/:name", updateQueue);

export default router;
