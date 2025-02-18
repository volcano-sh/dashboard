import express from 'express';
import {
    getAllJobs,
    getJobDetails,
    getJobYaml,
    getAllJobsWithoutPagination,
} from '../controllers/jobController.js';

const router = express.Router();

// Route to get all jobs with filtering options
router.get('/', getAllJobs);

// Route to get details of a specific job
router.get('/:namespace/:name', getJobDetails);

// Route to get YAML of a specific job
router.get('/:namespace/:name/yaml', getJobYaml);

// Route to get all jobs without pagination
router.get('/all-jobs', getAllJobsWithoutPagination);

export default router;
