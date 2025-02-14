import express from "express";
import { getAllPods, getPodYamlByName, getPods } from "../controllers/pod.js";

const router = express.Router();

router.get("/all-pods", getAllPods);
router.get('/pods', getPods);
router.get("/pod/:namespace/:name/yaml", getPodYamlByName);

export default router;