import { z } from "zod";

export const getQueueInputSchema = z.object({
    name: z.string(),
});

export const getQueuesInputSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    search: z.string().optional(),
    state: z.string().optional(),
});
