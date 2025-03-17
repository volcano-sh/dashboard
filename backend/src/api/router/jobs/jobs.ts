import yaml from "js-yaml";
import { k8sApi } from "../../../utils/k8s";
import { procedure, router } from "../../trpc";
import { getJobInputSchema, getJobsInputSchema } from "./schema";
import { fetchJobs, getJobState } from "../helpers";


export const jobsRouter = router({
    getJobs: procedure
        .input(getJobsInputSchema)
        .query(async ({ input }) => {
            const { namespace = "", searchTerm = "", queueFilter = "", statusFilter = "" } = input;
            console.log("Fetching jobs with params:", {
                namespace,
                searchTerm,
                queueFilter,
                statusFilter,
            });

            const filteredJobs = await fetchJobs(namespace, searchTerm, queueFilter, statusFilter);

            return {
                items: filteredJobs,
                totalCount: filteredJobs.length,
            };
        }),
    getJob: procedure
        .input(getJobInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            const response = await k8sApi.getNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                name
            });
            return response;
        }),
    getJobYaml: procedure
        .input(getJobInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            const response = await k8sApi.getNamespacedCustomObject({
                group: "batch.volcano.sh",
                version: "v1alpha1",
                namespace,
                plural: "jobs",
                name
            });

            const formattedYaml = yaml.dump(response.body, {
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
            pretty: "true"
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
});