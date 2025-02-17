import express from "express";
import { getAllJobs, getAllQueues, getAllPods } from '../controllers/withoutPaginationController.js';

const router = express.Router();

// Routes for fetching all jobs, queues, and pods without pagination
router.get("/jobs", getAllJobs);
router.get("/queues", getAllQueues);
router.get("/pods", getAllPods);

export default router;
