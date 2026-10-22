import { z } from "zod";

import { k8sIdentifierSchema } from "../identifier";
import { paginationInputSchema } from "../pagination";

export const getQueueInputSchema = z.object({
    name: k8sIdentifierSchema,
});

export const getQueuesInputSchema = paginationInputSchema.extend({});

export const createQueueInputSchema = z.object({
    queueManifest: z.object({
        apiVersion: z.string(),
        kind: z.string(),
        metadata: z.object({
            name: z.string(),
            annotations: z.record(z.string()).optional(),
        }),
        spec: z.any(),
    }),
});

export const updateQueueInputSchema = z.object({
    name: k8sIdentifierSchema,
    updatedBody: z.object({
        spec: z.any(),
    }),
});

export const deleteQueueInputSchema = z.object({
    name: k8sIdentifierSchema,
});
