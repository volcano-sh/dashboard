import { k8sApi } from "../config/k8sConfig.js";

// Determine job state based on status
export function getJobState(job) {
    if (job.status?.state) return job.status.state;
    if (job.status === "Running") return "Running";
    if (job.status === "Completed") return "Completed";
    if (job.status === "Failed") return "Failed";
    if (job.status === "Pending") return "Running";
    return job.status || "Unknown";
}

// Verify Volcano setup
export const verifyVolcanoSetup = async () => {
    try {
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
