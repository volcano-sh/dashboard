import { k8sApi } from "./config/kubernetes";
import app from "./app";

const verifyVolcanoSetup = async () => {
    try {
        // Verify CRD access
        await k8sApi.listClusterCustomObject(
            "batch.volcano.sh",
            "v1alpha1",
            "jobs"
        );
        return true;
    } catch (error) {
        console.error('Volcano verification failed:', error);
        return false;
    }
};

// Update your server startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    const volcanoReady = await verifyVolcanoSetup();
    if (volcanoReady) {
        console.log(`Server running on port ${PORT} with Volcano support`);
    } else {
        console.error('Server started but Volcano support is not available');
    }
});