import express from "express";
import * as namespacesController from "../controllers/namespacesController.js";

const router = express.Router();

// Namespaces route
router.get("/namespaces", namespacesController.getNamespaces);

export default router;