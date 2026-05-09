import express from "express";
import {
    getPods,
    getPodYaml,
    createPod,
    getPodLogs,
} from "../controllers/podController.js";

const router = express.Router();

router.get("/", getPods);
router.get("/:namespace/:name/yaml", getPodYaml);
router.get("/:namespace/:name/logs", getPodLogs);
router.post("/", createPod);

export default router;
