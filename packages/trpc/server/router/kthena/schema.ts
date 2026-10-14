import { z } from "zod";
import { paginationInputSchema } from "../pagination";

export const getModelServingsInputSchema = paginationInputSchema.extend({});

export const getModelServingInputSchema = z.object({
  namespace: z.string(),
  name: z.string(),
});
