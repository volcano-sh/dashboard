import { procedure, router } from "../../trpc";
import { auditService } from "../../services/audit";
import { getAuditEventsInputSchema } from "./schema";

export const auditRouter = router({
  getAuditEvents: procedure
    .input(getAuditEventsInputSchema)
    .query(async ({ input }) => {
      const { namespace, resourceType, search, page, pageSize } = input;
      const result = auditService.getEvents({
        namespace,
        resourceType,
        search,
        page,
        pageSize,
      });

      return {
        items: result.items,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        page: result.currentPage,
        pageSize: result.pageSize,
      };
    }),
});
