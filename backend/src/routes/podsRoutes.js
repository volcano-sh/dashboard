import express from "express";
import * as podsController from "../controllers/podsController.js";

const router = express.Router();

// Pods routes
router.get("/pods", podsController.getPods);
router.get("/pod/:namespace/:name/yaml", podsController.getPodYaml);
router.get("/all-pods", podsController.getAllPods);

export default router;