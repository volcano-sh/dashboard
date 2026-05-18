import { z } from "zod";

import { paginationInputSchema } from "../pagination";

export const getPodsInputSchema = paginationInputSchema.extend({});

export const getPodYamlInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});

export const createPodInputSchema = z.object({
    podManifest: z.object({
        apiVersion: z.string(),
        kind: z.string(),
        metadata: z.object({
            name: z.string(),
            namespace: z.string().optional(),
        }),
        spec: z.any(), // Allow flexible spec structure
    }),
});

export const deletePodInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
});

export const updatePodInputSchema = z.object({
    namespace: z.string(),
    name: z.string(),
    patchData: z.any(),
});
