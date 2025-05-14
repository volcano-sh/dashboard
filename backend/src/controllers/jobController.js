import { k8sApi } from "../config/k8sConfig.js";
import yaml from "js-yaml";
import { getJobState } from "../utils/helpers.js";

// Get jobs with filtering
export const getJobs = async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const queueFilter = req.query.queue || "";
        const statusFilter = req.query.status || "";

        console.log("Fetching jobs with params:", {
            namespace,
            searchTerm,
            queueFilter,
            statusFilter,
        });

        let response;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                plural: "jobs",
                pretty: true,
            });
        } else {
            response = await k8sApi.listNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                pretty: true,
            });
        }

        let filteredJobs = response.items || [];

        if (searchTerm) {
            filteredJobs = filteredJobs.filter((job) =>
                job.metadata.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        // Apply queueFilter filtering
        if (queueFilter && queueFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.spec.queue === queueFilter,
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.status.state.phase === statusFilter,
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
            details: err.message,
        });
    }
};

// Get a specific job by namespace and name
export const getJobById = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
        res.json(response);
    } catch (err) {
        console.error("Error fetching job:", err);
        res.status(500).json({
            error: "Failed to fetch job",
            details: err.message,
        });
    }
};

// Get YAML for a specific job
export const getJobYaml = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });

        const formattedYaml = yaml.dump(response, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching job YAML:", error);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: error.message,
        });
    }
};

// Get all jobs without pagination
export const getAllJobs = async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: true,
        });

        const jobs = response.items.map((job) => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase:
                    job.status?.phase || job.spec?.minAvailable
                        ? "Running"
                        : "Unknown",
            },
        }));

        res.json({
            items: jobs,
            totalCount: jobs.length,
        });
    } catch (err) {
        console.error("Error fetching all jobs:", err);
        res.status(500).json({ error: "Failed to fetch all jobs" });
    }
};
