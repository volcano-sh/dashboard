

import { dashboardRouter } from "./router/dashboard/dashboard";
import { jobsRouter } from "./router/jobs/jobs";
import { podRouter } from "./router/pods/pods";
import { queueRouter } from "./router/queues/queues";
import { router } from "./trpc";

export const appRouter = router({
    jobsRouter,
    podRouter,
    queueRouter,
    dashboardRouter,
});

export type AppRouter = typeof appRouter;
