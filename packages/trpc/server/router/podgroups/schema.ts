import { z } from "zod";

import { paginationInputSchema } from "../pagination";

export const getPodGroupsInputSchema = paginationInputSchema.extend({
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

