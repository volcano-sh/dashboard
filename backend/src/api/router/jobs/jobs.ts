import yaml from "js-yaml";
import { k8sApi } from "../../../utils/k8s";
import { procedure, router } from "../../trpc";
import { fetchJobs, getJobState } from "../helpers";
import {
    createJobInputSchema,
    deleteJobInputSchema,
    getJobInputSchema,
    getJobsInputSchema,
    updateJobInputSchema
} from "./schema";

export const jobsRouter = router({
    getJobs: procedure.input(getJobsInputSchema).query(async ({ input }) => {
        const {
            namespace = "",
            search = "",
            queue = "",
            status = "",
            page = 1,
            pageSize = 10,
        } = input;
        console.log("Fetching jobs with params:", {
            namespace,
            search,
            queue,
            status,
            page,
            pageSize,
        });

        const filteredJobs = await fetchJobs(
            namespace,
            search,
            queue,
            status,
            page,
            pageSize,
        );

        return filteredJobs;
    }),
    getJob: procedure.input(getJobInputSchema).query(async ({ input }) => {
        const { namespace, name } = input;
        const response = await k8sApi.getNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
        });
        return response;
    }),
    getJobYaml: procedure.input(getJobInputSchema).query(async ({ input }) => {
        const { namespace, name } = input;
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

        return formattedYaml;
    }),
    getAllJobs: procedure.query(async () => {
        const response = await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
            pretty: "true",
        });

        const jobs = response.items.map((job: any) => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase:
                    job.status?.phase || job.spec?.minAvailable
                        ? "Running"
                        : "Unknown",
            },
        }));

        return {
            items: jobs,
            totalCount: jobs.length,
        };
    }),
    createJob: procedure.input(createJobInputSchema).mutation(async ({ input }) => {
        const { jobManifest } = input;

        if (!jobManifest.metadata.name || !jobManifest.spec) {
            throw new Error("Invalid job manifest: name and spec are required");
        }

        const namespace = jobManifest.metadata.namespace || "default";

        const response = await k8sApi.createNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            body: jobManifest,
        });

        return {
            message: "Job created successfully",
            data: response.body,
        };
    }),
    updateJob: procedure.input(updateJobInputSchema).mutation(async ({ input }) => {
        const { namespace, name, patchData } = input;

        const response = await k8sApi.patchNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
            body: patchData,
        });

        return {
            message: "Job updated successfully",
            data: response.body,
        };
    }),
    deleteJob: procedure.input(deleteJobInputSchema).mutation(async ({ input }) => {
        const { namespace, name } = input;

        const response = await k8sApi.deleteNamespacedCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            namespace,
            plural: "jobs",
            name,
            body: { propagationPolicy: "Foreground" },
        });

        return {
            message: "Job deleted successfully",
            data: response.body,
        };
    }),
});
