import { z } from "zod";

export const getQueueInputSchema = z.object({
    name: z.string(),
});

export const getQueuesInputSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
});

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
