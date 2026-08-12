
import { z } from 'zod'

import { procedure, router } from '../../trpc'
import { paginationInputSchema } from '../pagination'
import { auditService } from '../../utils/audit'

const auditEventsInputSchema = paginationInputSchema.extend({
  search: z.string().optional(),
  resourceType: z.string().optional(),
})

export const auditRouter = router({
  getAuditEvents: procedure
    .input(auditEventsInputSchema)
    .query(async ({ input }) => {
      const {
        page = 1,
        pageSize = 10,
        search,
        resourceType,
      } = input

      return auditService.listRecentEvents({
        page,
        pageSize,
        search,
        resourceType,
      })
    }),
})

export default auditRouter

