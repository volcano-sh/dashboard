import { KubeConfig } from "@kubernetes/client-node";
import fs from "fs";
import path from "path";

class ClusterService {
    constructor() {
        this.kc = new KubeConfig();
        this.kc.loadFromDefault();
    }

    async listClusters() {
        try {
            const contexts = this.kc.getContexts();
            return contexts.map((ctx) => ({
                name: ctx.name,
                cluster: ctx.cluster,
                user: ctx.user,
                isCurrent: ctx.name === this.kc.getCurrentContext(),
            }));
        } catch (error) {
            console.error("Error listing clusters:", error);
            return [];
        }
    }

    getKubeConfigForContext(contextName) {
        const newKc = new KubeConfig();
        newKc.loadFromDefault();
        if (contextName) {
            newKc.setCurrentContext(contextName);
        }
        return newKc;
    }
}

export default new ClusterService();
