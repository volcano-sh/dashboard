import { z } from "zod";

import { k8sIdentifierSchema } from "../identifier";
import { paginationInputSchema } from "../pagination";

export const getJobsInputSchema = paginationInputSchema.extend({});

export const getJobInputSchema = z.object({
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
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
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
    patchData: z.any(),
});

export const deleteJobInputSchema = z.object({
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
});
