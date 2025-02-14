import express from "express";
import { getNamespaces } from "../controllers/namespace.js";

const router = express.Router();

router.get("/namespaces", getNamespaces);

export default router;