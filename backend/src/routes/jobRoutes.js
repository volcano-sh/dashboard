import {
    getJobs,
    getJobById,
    getJobYaml,
    getAllJobs,
} from "../controllers/jobController.js";

export const jobRoutes = (app) => {
    app.get("/api/jobs", getJobs);
    app.get("/api/jobs/:namespace/:name", getJobById);
    app.get("/api/job/:namespace/:name/yaml", getJobYaml);
    app.get("/api/all-jobs", getAllJobs);
};
