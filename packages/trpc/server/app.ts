import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { appRouter } from "./api/router";
import { configs } from "./utils/configs";
import { k8sApi } from "./utils/k8s";

const app = express();
app.use(cors({ origin: "*" }));

app.use(
    "/api",
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: () => ({ session: null }),
    }),
);

const verifyVolcanoSetup = async () => {
    try {
        await k8sApi.listClusterCustomObject({
            group: "batch.volcano.sh",
            version: "v1alpha1",
            plural: "jobs",
        });
        return true;
    } catch (error) {
        console.error("Volcano verification failed:", error);
        return false;
    }
};

export const server = app.listen(configs.Port, async () => {
    const volcanoReady = await verifyVolcanoSetup();
    if (volcanoReady) {
        console.log(
            `Server running on port ${configs.Port} with Volcano support`,
        );
    } else {
        console.error("Server started but Volcano support is not available");
    }
});
