import express from "express";
import { getNamespaces } from "../controllers/namespace";

const router = express.Router();

router.get("/namespaces", getNamespaces);

export default router;