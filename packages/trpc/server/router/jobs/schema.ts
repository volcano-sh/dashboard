import { z } from "zod";

import { paginationInputSchema } from "../pagination";

export const getJobsInputSchema = paginationInputSchema.extend({});

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
