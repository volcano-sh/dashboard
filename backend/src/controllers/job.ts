import { Request, Response } from "express";
import { k8sApi } from "../config/kubernetes";
import http from "http";
import yaml from "js-yaml";
import { IJob } from "../types/index";

interface IResponse {
    items: IJob[];
}

// Auxiliary function: determine the status based on the job status
function getJobState(job: IJob) {
    if (job.status === "Running") return "Running";
    if (job.status === "Completed") return "Completed";
    if (job.status === "Failed") return "Failed";
    if (job.status === "Pending") return "Running";
    return job.status || "Unknown";
}

// @desc Get all Jobs (no pagination)
// @route GET /all-jobs
export const getAllJobs = async (req: Request, res: Response) => {
    try {
        const response: IResponse = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs", // 修改这里：从 "jobs" 改为 "vcjobs"
            pretty: "true",
        });

        const jobs = response.items.map((job) => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase:
                    job.status?.state?.phase || job.spec?.minAvailable
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

interface JobQueryParams {
    namespace?: string;
    search?: string;
    queue?: string;
    status?: string;
}

// @desc Get Jobs with pagination
// @route GET /jobs
export const getJobs = async (
    req: Request<{}, {}, {}, JobQueryParams>,
    res: Response,
) => {
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

        let response: IResponse;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                plural: "jobs",
                pretty: "true",
            });
        } else {
            response = await k8sApi.listNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                pretty: "true",
            });
        }

        let filteredJobs = response.items || [];

        if (searchTerm) {
            filteredJobs = filteredJobs.filter((job) =>
                job.metadata?.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        }

        // Apply queueFilter filtering
        if (queueFilter && queueFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.spec?.queue === queueFilter,
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredJobs = filteredJobs.filter(
                (job) => job.status?.state?.phase === statusFilter,
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
            details: (err as Error).message,
        });
    }
};

// @desc Add an interface to obtain a single job
// @route GET /jobs/:namespace/:name
export const getJobByName = async (req: Request, res: Response) => {
    try {
        const { namespace, name } = req.params;
        const response: IResponse = await k8sApi.getNamespacedCustomObject({
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
            details: (err as Error).message,
        });
    }
};

interface JobParams {
    namespace: string;
    name: string;
}
//@desc Add a route to obtain YAML for a single job
//@route GET /jobs/:namespace/:name/yaml
export const getJobYamlByName = async (
    req: Request<JobParams>,
    res: Response,
) => {
    try {
        const { namespace, name } = req.params;
        const response: IResponse = await k8sApi.getNamespacedCustomObject({
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
    } catch (err) {
        console.error("Error fetching job YAML:", err);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: (err as Error).message,
        });
    }
};
