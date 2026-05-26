import { z } from "zod";

import { paginationInputSchema } from "../pagination";

export const getQueueInputSchema = z.object({
    name: z.string(),
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
    name: z.string(),
    updatedBody: z.object({
        spec: z.any(),
    }),
});

export const deleteQueueInputSchema = z.object({
    name: z.string(),
});
