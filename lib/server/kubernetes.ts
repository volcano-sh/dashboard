import {
    CoreV1Api,
    CustomObjectsApi,
    KubeConfig,
} from "@kubernetes/client-node";
import yaml from "js-yaml";

let clients;

export function getKubernetesClients() {
    if (clients) {
        return clients;
    }

    const kc = new KubeConfig();
    kc.loadFromDefault();

    clients = {
        kc,
        k8sApi: kc.makeApiClient(CustomObjectsApi),
        k8sCoreApi: kc.makeApiClient(CoreV1Api),
    };

    return clients;
}

export function yamlResponse(data) {
    return yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    });
}

export function getErrorStatus(error) {
    return error?.statusCode || error?.response?.statusCode || 500;
}

export function getErrorMessage(error, fallback) {
    return (
        error?.body?.message ||
        error?.response?.body?.message ||
        error?.body?.details ||
        error?.response?.body?.details ||
        error?.message ||
        fallback
    );
}
