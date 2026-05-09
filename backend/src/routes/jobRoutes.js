import express from "express";
import {
    getJobs,
    getJobDetails,
    getJobYaml,
    createJob,
    updateJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/:namespace/:name", getJobDetails);
router.get("/:namespace/:name/yaml", getJobYaml);
router.post("/", createJob);
router.patch("/:namespace/:name", updateJob);

export default router;
