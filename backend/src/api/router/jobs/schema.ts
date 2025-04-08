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
