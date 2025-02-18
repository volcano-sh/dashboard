
import { k8sCoreApi, k8sApi } from '../services/k8sClient.js';

// Controller function to fetch all Kubernetes jobs
export const getAllJobs = async (req, res) => {
    try {
       
        const response = await k8sApi.listClusterCustomObject(
            "batch.volcano.sh", 
            "v1alpha1", 
            "jobs", 
            { pretty: true } 
        );
        
     
        const jobs = response.body.items.map(job => ({
            ...job,  
            status: {
                state: job.status?.state || 'Unknown',  
                phase: job.status?.phase || 'Running'  
            }
        }));

        
        res.json({
            items: jobs,  
            totalCount: jobs.length  
        });
    } catch (err) {
       
        console.error("Error fetching all jobs:", err);
        res.status(500).json({ error: "Failed to fetch all jobs" });
    }
};
// Controller function to fetch all Kubernetes queues

export const getAllQueues = async (req, res) => {
    try {
        const response = await k8sApi.listClusterCustomObject(
            "scheduling.volcano.sh",  
            "v1beta1", 
            "queues" 
        );

        res.json({
            items: response.body.items,
            totalCount: response.body.items.length  
        });
    } catch (error) {
       
        console.error("Error fetching all queues:", error);
        res.status(500).json({ error: "Failed to fetch all queues" });
    }
};

// Controller function to fetch all Kubernetes pods
export const getAllPods = async (req, res) => {
    try {
        const response = await k8sCoreApi.listPodForAllNamespaces();

        res.json({
            items: response.body.items,  
            totalCount: response.body.items.length  
        });
    } catch (error) {
       
        console.error('Error fetching all pods:', error);
        res.status(500).json({ error: 'Failed to fetch all pods' });
    }
};
