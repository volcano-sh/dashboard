import express from "express";
import cors from "cors";
import { KubeConfig } from "@kubernetes/client-node";
import { app } from "../src/app.js";

const kc = new KubeConfig();
kc.loadFromDefault();

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    const volcanoReady = await verifyVolcanoSetup();
    if (volcanoReady) {
        console.log(`Server running on port ${PORT} with Volcano support`);
    } else {
        console.error("Server started but Volcano support is not available");
    }
});

// Verify Volcano CRDs are accessible
const verifyVolcanoSetup = async () => {
    try {
        // Import k8sApi from our config
        const { k8sApi } = await import("../src/config/kubernetesClient.js");
        
        // Verify CRD access
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