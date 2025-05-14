import { jobRoutes } from "./jobRoutes.js";
import { queueRoutes } from "./queueRoutes.js";
import { podRoutes } from "./podRoutes.js";
import { namespaceRoutes } from "./namespaceRoutes.js";

// Aggregate all routes
export const routes = (app) => {
    jobRoutes(app);
    queueRoutes(app);
    podRoutes(app);
    namespaceRoutes(app);
};
