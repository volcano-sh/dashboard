import { z } from "zod";

export const getPodsInputSchema = z.object({
    namespace: z.string().optional(),
    searchTerm: z.string().optional(),
    statusFilter: z.string().optional(),
});

export const getPodYamlInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});