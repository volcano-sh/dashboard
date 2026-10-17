import { z } from "zod";

import { paginationInputSchema } from "../pagination";

export const getModelServingsInputSchema = paginationInputSchema.extend({});

export const getModelServingInputSchema = z.object({
    namespace: z.string().min(1),
    name: z.string().min(1),
});

const modelServingManifestSchema = z.object({
    apiVersion: z.string(),
    kind: z.string(),
    metadata: z.object({
        name: z.string().min(1),
        namespace: z.string().optional(),
        labels: z.record(z.string()).optional(),
        annotations: z.record(z.string()).optional(),
    }),
    spec: z.record(z.unknown()),
});

export const createModelServingInputSchema = z.object({
    manifest: modelServingManifestSchema,
});

export const updateModelServingInputSchema = z.object({
    namespace: z.string().min(1),
    name: z.string().min(1),
    patchData: modelServingManifestSchema,
});

export const deleteModelServingInputSchema = getModelServingInputSchema;
