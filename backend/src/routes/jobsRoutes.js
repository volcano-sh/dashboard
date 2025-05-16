import express from "express";
import * as jobsController from "../controllers/jobsController.js";

const router = express.Router();

// Jobs routes
router.get("/jobs", jobsController.getJobs);
router.get("/jobs/:namespace/:name", jobsController.getJobByName);
router.get("/job/:namespace/:name/yaml", jobsController.getJobYaml);
router.get("/all-jobs", jobsController.getAllJobs);

export default router;