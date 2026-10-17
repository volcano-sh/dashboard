import { procedure, router } from "../../trpc";
import { k8sCoreApi } from "../../utils/k8s";

export const nodesRouter = router({
    getNodes: procedure.query(async () => {
        try {
            const response = await k8sCoreApi.listNode();
            const nodes = response.items || [];
            
            return nodes.map(node => {
                const status = node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady';
                
                // Get roles from labels (kubernetes.io/role or node-role.kubernetes.io/*)
                const labels = node.metadata?.labels || {};
                const roles = Object.keys(labels)
                    .filter(k => k.startsWith('node-role.kubernetes.io/') || k === 'kubernetes.io/role')
                    .map(k => k === 'kubernetes.io/role' ? labels[k] : k.split('/')[1]);
                
                return {
                    name: node.metadata?.name || 'Unknown',
                    status,
                    roles: roles.length > 0 ? roles : ['<none>'],
                    capacity: {
                        cpu: node.status?.capacity?.cpu || '0',
                        memory: node.status?.capacity?.memory || '0',
                    },
                    allocatable: {
                        cpu: node.status?.allocatable?.cpu || '0',
                        memory: node.status?.allocatable?.memory || '0',
                    },
                    os: labels['kubernetes.io/os'] || 'unknown',
                    architecture: labels['kubernetes.io/arch'] || 'unknown',
                    creationTimestamp: node.metadata?.creationTimestamp
                };
            });
        } catch (error) {
            console.error("Error fetching nodes:", error);
            throw new Error("Failed to fetch nodes");
        }
    }),
});
