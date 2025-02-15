import { k8sApi } from "../config/kubernetes";
import http from 'http';
import yaml from "js-yaml";
import { Request, Response } from "express";
import IJob from "../types/job";

interface IResponse {
    response: http.IncomingMessage; body: { items: IJob[] }
}

// Auxiliary function: determine the status based on the job status
function getJobState(job: IJob) {
    if (job.status?.state) return job.status.state;
    if (job.status?.Running) return 'Running';
    if (job.status?.Completed) return 'Completed';
    if (job.status?.Failed) return 'Failed';
    if (job.status?.Pending) return 'Pending';
    return job.status || 'Unknown';
}

// Get all Jobs (no pagination)
export const getAllJobs = async (req: Request, res: Response) => {
    try {
        const response = await k8sApi.listClusterCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            "jobs", // 修改这里：从 "jobs" 改为 "vcjobs"
            "true",
        ) as IResponse;

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

interface JobQueryParams {
    namespace?: string;
    search?: string;
    queue?: string;
    status?: string;
}
export const getJobs = async (req: Request<{}, {}, {}, JobQueryParams>, res: Response) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const queueFilter = req.query.queue || "";
        const statusFilter = req.query.status || "";

        console.log('Fetching jobs with params:', { namespace, searchTerm, queueFilter, statusFilter });

        let response: IResponse;
        if (namespace === "" || namespace === "All") {
            response = await k8sApi.listClusterCustomObject(
                "batch.volcano.sh",
                "v1alpha1",
                "jobs",
                "true",
            ) as IResponse;
        } else {
            response = await k8sApi.listNamespacedCustomObject(
                "batch.volcano.sh",
                "v1alpha1",
                namespace,
                "jobs",
                "true"
            ) as IResponse;
        }

        let filteredJobs = response.body.items || [];

        if (searchTerm) {
            filteredJobs = filteredJobs.filter((job) =>
                (job.metadata?.name as string).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply queueFilter filtering
        if (queueFilter && queueFilter !== "All") {
            filteredJobs = filteredJobs.filter((job) =>
                job.spec?.queue === queueFilter
            );
        }

        if (statusFilter && statusFilter !== "All") {
            filteredJobs = filteredJobs.filter((job) =>
                job.status?.state?.phase === statusFilter
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
            details: (err as Error).message
        });
    }
}

// Add an interface to obtain a single job
export const getJobByName = async (req: Request, res: Response) => {
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
            details: (err as Error).message
        });
    }
}

interface JobParams {
    namespace: string;
    name: string;
}
// Add a route to obtain YAML in server.js
export const getJobYamlByName = async (req: Request<JobParams>, res: Response) => {
    try {
        const { namespace, name } = req.params;
        const response = await k8sApi.getNamespacedCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            namespace,
            "jobs",
            name
        ) as IResponse;

        const formattedYaml = yaml.dump(response.body, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });

        res.setHeader('Content-Type', 'text/yaml');
        res.send(formattedYaml);
    } catch (err) {
        console.error("Error fetching job YAML:", err);
        res.status(500).json({
            error: "Failed to fetch job YAML",
            details: (err as Error).message
        });
    }
}