import { z } from "zod";

import { paginationInputSchema } from "../pagination";

export const getModelServingsInputSchema = paginationInputSchema.extend({});

export const getModelServingInputSchema = z.object({
    namespace: z.string().min(1),
    name: z.string().min(1),
});
