import { z } from "zod"; 

export const getQueueInputSchema = z.object({
    name: z.string(),
});

export const getQueuesInputSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    searchTerm: z.string().optional(),
    stateFilter: z.string().optional(),
});
