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

const updateJobManifestSchema = z.object({
    apiVersion: z.string(),
    kind: z.literal("Job"),
    metadata: z.object({
        name: z.string().min(1),
        namespace: z.string().optional(),
        labels: z.record(z.string()).optional(),
        annotations: z.record(z.string()).optional(),
    }),
    spec: z.record(z.unknown()),
});

export const updateJobInputSchema = z.object({
    namespace: z.string().min(1),
    name: z.string().min(1),
    patchData: updateJobManifestSchema,
});

export const deleteJobInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});
