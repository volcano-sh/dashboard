import { z } from "zod";

export const getPodsInputSchema = z.object({
    namespace: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(10),
});

export const getPodYamlInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});
