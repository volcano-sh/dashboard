const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const api = kc.makeApiClient(k8s.CoreV1Api);

async function test() {
    try {
        const options = { headers: { 'Content-Type': 'application/merge-patch+json' } };
        const res = await api.patchNamespacedConfigMap(
            {
                name: 'volcano-scheduler-configmap',
                namespace: 'volcano-system',
                body: { data: { "volcano-scheduler.conf": "test" } }
            },
            options
        );
        console.log("Success!");
    } catch (err) {
        console.log("Error:", err.body);
    }
}
test();
