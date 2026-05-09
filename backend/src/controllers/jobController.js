import k8sService from "../services/k8sService.js";
import yaml from "js-yaml";

export const getJobs = async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const queueFilter = req.query.queue || "";
        const statusFilter = req.query.status || "";

        const result = await k8sService.listJobs(
            req.clusterContext,
            namespace,
            searchTerm,
            queueFilter,
            statusFilter,
        );
        res.json(result);
    } catch (err) {
        console.error("Error fetching jobs:", err);
        res.status(500).json({
            error: "Failed to fetch jobs",
            details: err.message,
        });
    }
};

export const getJobDetails = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const result = await k8sService.getJob(req.clusterContext, namespace, name);
        res.json(result);
    } catch (err) {
        console.error("Error fetching job:", err);
        res.status(500).json({
            error: "Failed to fetch job",
            details: err.message,
        });
    }
};

export const getJobYaml = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const result = await k8sService.getJob(req.clusterContext, namespace, name);

        const formattedYaml = yaml.dump(result, {
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

export const createJob = async (req, res) => {
    const jobManifest = req.body;
    try {
        if (
            !jobManifest ||
            !jobManifest.metadata ||
            !jobManifest.metadata.name ||
            !jobManifest.spec
        ) {
            return res.status(400).json({ error: "Invalid job manifest" });
        }

        const result = await k8sService.createJob(req.clusterContext, jobManifest);
        res.status(201).json({
            message: "Job created successfully",
            data: result.body,
        });
    } catch (error) {
        console.error("Error creating job:", error?.body || error);
        let msg = "Failed to create job";
        if (error?.body?.message) msg = error.body.message;
        res.status(500).json({ error: msg });
    }
};

export const updateJob = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const patchData = req.body;

        const result = await k8sService.patchJob(req.clusterContext, namespace, name, patchData);
        res.json({ message: "Job updated successfully", data: result.body });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ error: "Failed to update job" });
    }
};
