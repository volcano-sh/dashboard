

import { dashboardRouter } from "./router/dashboard/dashboard";
import { jobsRouter } from "./router/jobs/jobs";
import { modelBoostersRouter } from "./router/modelboosters/modelboosters";
import { modelRoutesRouter } from "./router/modelroutes/modelroutes";
import { modelServersRouter } from "./router/modelservers/modelservers";
import { modelServingsRouter } from "./router/modelservings/modelservings";
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
    modelServingsRouter,
    modelBoostersRouter,
    modelServersRouter,
    modelRoutesRouter,
});

export type AppRouter = typeof appRouter;
