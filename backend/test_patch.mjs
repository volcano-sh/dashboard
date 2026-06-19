import * as k8s from '@kubernetes/client-node';
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const api = kc.makeApiClient(k8s.CoreV1Api);

async function test() {
    try {
        const options = { headers: { 'Content-Type': 'application/merge-patch+json' } };
        const res = await api.patchNamespacedConfigMap(
            'volcano-scheduler-configmap',
            'volcano-system',
            { data: { "volcano-scheduler.conf": "test" } },
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            options
        );
        console.log("Success!");
    } catch (err) {
        console.log("Error:", err.body);
    }
}
test();
