

import { jobsRouter } from "./router/jobs/jobs";
import { namespaceRouter } from "./router/namespaces/namespaces";
import { podRouter } from "./router/pods/pods";
import { queueRouter } from "./router/queues/queues";
import { router } from "./trpc";

export const appRouter = router({
    jobsRouter,
    podRouter,
    namespaceRouter,
    queueRouter,
});

export type AppRouter = typeof appRouter;
