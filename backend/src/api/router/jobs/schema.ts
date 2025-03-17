import {z} from "zod"

export const getJobsInputSchema = z.object({
    namespace: z.string().optional(),
    searchTerm: z.string().optional(),
    queueFilter: z.string().optional(),
    statusFilter: z.string().optional(),
});

export const getJobInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});

