import express from "express";
import {
    getAllJobs,
    getJobByName,
    getJobYamlByName,
    getJobs,
} from "../controllers/job";

const router = express.Router();

router.get("/all-jobs", getAllJobs);
router.get("/jobs", getJobs);
router.get("/jobs/:namespace/:name", getJobByName);
router.get("/job/:namespace/:name/yaml", getJobYamlByName);

export default router;
