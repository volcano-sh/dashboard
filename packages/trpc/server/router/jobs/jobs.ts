import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { validateJobManifest } from "../../utils/job-validation";
import { k8sApi } from "../../utils/k8s";
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
            page = 1,
            pageSize = 10,
        } = input;
        console.log("Fetching jobs with params:", {
            page,
            pageSize,
        });

        return fetchJobs(page, pageSize);
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jobs = response.items.map((job: any) => ({
            ...job,
            status: {
                state: job.status?.state || getJobState(job),
                phase:
                    job.status?.state?.phase ??
                    job.status?.phase ??
                    "Unknown",
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

        const jobError = validateJobManifest(jobManifest as Record<string, unknown>);
        if (jobError) {
            throw new Error(jobError);
        }

        const namespace = jobManifest.metadata.namespace || "default";

        try {
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
        } catch (error) {
            throw new Error(formatK8sApiError(error));
        }
    }),
    updateJob: procedure.input(updateJobInputSchema).mutation(async ({ input }) => {
        const { namespace, name, patchData } = input;

        if (patchData.metadata.name !== name) {
            throw new Error(
                `Job name in manifest (${patchData.metadata.name}) must match path name (${name})`,
            );
        }

        const patchNamespace = patchData.metadata.namespace ?? namespace;
        if (patchNamespace !== namespace) {
            throw new Error(
                `Job namespace in manifest (${patchNamespace}) must match path namespace (${namespace})`,
            );
        }

        const jobError = validateJobManifest(patchData as Record<string, unknown>);
        if (jobError) {
            throw new Error(jobError);
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentJob = (await k8sApi.getNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                name,
            })) as any;

            const updatedJob = {
                apiVersion: patchData.apiVersion || currentJob.apiVersion,
                kind: patchData.kind || currentJob.kind,
                metadata: {
                    ...currentJob.metadata,
                    labels: patchData.metadata.labels ?? currentJob.metadata?.labels,
                    annotations:
                        patchData.metadata.annotations ?? currentJob.metadata?.annotations,
                    name: currentJob.metadata?.name,
                    namespace: currentJob.metadata?.namespace,
                    resourceVersion: currentJob.metadata?.resourceVersion,
                    uid: currentJob.metadata?.uid,
                    creationTimestamp: currentJob.metadata?.creationTimestamp,
                },
                spec: patchData.spec,
                status: currentJob.status,
            };

            const response = await k8sApi.replaceNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                name,
                body: updatedJob,
            });

            return {
                message: "Job updated successfully",
                data: response,
            };
        } catch (error) {
            throw new Error(formatK8sApiError(error));
        }
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
