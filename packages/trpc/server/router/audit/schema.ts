import { z } from "zod";
import { paginationInputSchema } from "../pagination";

export const getAuditEventsInputSchema = paginationInputSchema.extend({
  namespace: z.string().optional(),
  resourceType: z.string().optional(),
  search: z.string().optional(),
});

export type GetAuditEventsInput = z.infer<typeof getAuditEventsInputSchema>;
