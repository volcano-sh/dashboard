import { z } from "zod";

import { k8sIdentifierSchema } from "../identifier";
import { paginationInputSchema } from "../pagination";

export const getPodsInputSchema = paginationInputSchema.extend({});

export const getPodYamlInputSchema = z.object({
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
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
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
});

export const updatePodInputSchema = z.object({
    namespace: k8sIdentifierSchema,
    name: k8sIdentifierSchema,
    patchData: z.any(),
});
