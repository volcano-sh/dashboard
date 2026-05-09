import express from "express";
import {
    getPods,
    getPodYaml,
    createPod,
} from "../controllers/podController.js";

const router = express.Router();

router.get("/", getPods);
router.get("/:namespace/:name/yaml", getPodYaml);
router.post("/", createPod);

export default router;
