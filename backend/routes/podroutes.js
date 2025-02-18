import express from "express";
import * as podController from "../controllers/podController.js";

const router = express.Router();


router.get("/", podController.getAllPods);
router.get("/:namespace/:name/yaml", podController.getPodYaml);
router.get("/namespaces", podController.getNamespaces);

export { router as podRoutes };
