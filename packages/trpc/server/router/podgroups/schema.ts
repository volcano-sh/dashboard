import { z } from "zod";

export const getPodGroupsInputSchema = z.object({
    namespace: z.string().optional().default(""),
    search: z.string().optional().default(""),
    status: z.string().optional().default(""),
});

export const getPodGroupInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});

export const getPodGroupYamlInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});

