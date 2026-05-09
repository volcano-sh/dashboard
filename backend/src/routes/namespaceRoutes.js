import express from "express";
import { getNamespaces } from "../controllers/namespaceController.js";

const router = express.Router();

router.get("/", getNamespaces);

export default router;
