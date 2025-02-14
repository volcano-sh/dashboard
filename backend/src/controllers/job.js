import { k8sApi } from "../config/kubernetes.js";
import yaml from "js-yaml";

// Auxiliary function: determine the status based on the job status
function getJobState(job) {
    if (job.status?.state) return job.status.state;
    if (job.status === 'Running') return 'Running';
    if (job.status === 'Completed') return 'Completed';
    if (job.status === 'Failed') return 'Failed';
    if (job.status === 'Pending') return 'Running';
    return job.status || 'Unknown';
}

// Get all Jobs (no pagination)
export const getAllJobs = async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            "jobs", // 修改这里：从 "jobs" 改为 "vcjobs"
            {
                pretty: true,
            }
        );

        const jobs = response.body.items.map(job => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase: job.status?.phase || job.spec?.minAvailable ? 'Running' : 'Unknown'
            }
        }));

        res.json({
            items: jobs,
            totalCount: jobs.length
        });
    } catch (err) {
        console.error("Error fetching all jobs:", err);
        res.status(500).json({ error: "Failed to fetch all jobs" });
    }
}

export const getJobs = async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const queueFilter = req.query.queue || "";
        const statusFilter = req.query.status || "";

        console.log('Fetching jobs with params:', { namespace, searchTerm, queueFilter, statusFilter });

        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject(
                "batch.volcano.sh",
                "v1alpha1",
                "jobs",
                true,
            );
        } else {
            response = await k8sApi.listNamespacedCustomObject(
                "batch.volcano.sh",
                "v1alpha1",
                namespace,
                "jobs",
                true);
        }

        let filteredJobs = response.body.items || [];

        if (searchTerm) {
            filteredJobs = filteredJobs.filter((job) =>
                job.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply queueFilter filtering
        if (queueFilter && queueFilter !== "All") {
            filteredJobs = filteredJobs.filter((job) =>
                job.spec.queue === queueFilter
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredJobs = filteredJobs.filter((job) =>
                job.status.state.phase === statusFilter
            );
        }

        res.json({
            items: filteredJobs,
            totalCount: filteredJobs.length,
        });
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({
            error: "Failed to fetch jobs",
            details: err.message
        });
    }
}

// Add an interface to obtain a single job
export const getJobByName = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            namespace,
            "jobs",
            name
        );
        res.json(response.body);
    } catch (err) {
        console.error("Error fetching job:", err);
        res.status(500).json({
            error: "Failed to fetch job",
            details: err.message
        });
    }
}

// Add a route to obtain YAML in server.js
export const getJobYamlByName = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            namespace,
            "jobs",
            name
        );

        const formattedYaml = yaml.dump(response.body, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        res.setHeader('Content-Type', 'text/yaml');
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: error.message
        });
    }
}