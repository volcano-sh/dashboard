import { z } from "zod";

import { k8sIdentifierSchema } from "../identifier";
import { paginationInputSchema } from "../pagination";

export const getPodGroupsInputSchema = paginationInputSchema.extend({
    namespace: z.string().optional().default(""),
    search: z.string().optional().default(""),
    status: z.string().optional().default(""),
});

export const getPodGroupInputSchema = z.object({
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
});

export const getPodGroupYamlInputSchema = z.object({
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
});

