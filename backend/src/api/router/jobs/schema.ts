import { z } from "zod";

export const getJobsInputSchema = z.object({
    namespace: z.string().optional(),
    search: z.string().optional(),
    queue: z.string().optional(),
    status: z.string().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
});

export const getJobInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});

export const createJobInputSchema = z.object({
    jobManifest: z.object({
        apiVersion: z.string(),
        kind: z.string(),
        metadata: z.object({
            name: z.string(),
            namespace: z.string().optional(),
        }),
        spec: z.any(),
    }),
});

export const updateJobInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
    patchData: z.any(),
});

export const deleteJobInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});
