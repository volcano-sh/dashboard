

import { dashboardRouter } from "./router/dashboard/dashboard";
import { jobsRouter } from "./router/jobs/jobs";
import { podRouter } from "./router/pods/pods";
import { podgroupsRouter } from "./router/podgroups/podgroups";
import { queueRouter } from "./router/queues/queues";
import { router } from "./trpc";

export const appRouter = router({
    jobsRouter,
    podRouter,
    podgroupsRouter,
    queueRouter,
    dashboardRouter,
});

export type AppRouter = typeof appRouter;
