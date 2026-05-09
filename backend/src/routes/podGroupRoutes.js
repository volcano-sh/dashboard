import express from "express";
import {
    getPodGroups,
    getPodGroupDetails,
    getPodGroupYaml,
} from "../controllers/podGroupController.js";

const router = express.Router();

router.get("/", getPodGroups);
router.get("/:namespace/:name", getPodGroupDetails);
router.get("/:namespace/:name/yaml", getPodGroupYaml);

export default router;
