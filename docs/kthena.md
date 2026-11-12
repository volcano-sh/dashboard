# Manage Kthena resources in Volcano Dashboard

The dashboard can list, inspect, create, edit, and delete Kthena inference CRDs without kubectl.

## Prerequisites

- A Kubernetes cluster with [Volcano](https://github.com/volcano-sh/volcano) installed
- [Kthena](https://github.com/volcano-sh/kthena) CRDs (Helm or manifests)
- The dashboard install from `deployment/volcano-dashboard.yaml` so the ClusterRole includes `workload.serving.volcano.sh` and `networking.serving.volcano.sh`
- A kubeconfig the dashboard can use (`kubectl` current context, or in-cluster config)

Without Kthena CRDs, the Kthena pages stay up and show that the CRDs are missing. Jobs, Queues, Pods, and PodGroups still work.

## Pages

Open the **Kthena** section in the sidebar:

| Page | Kind | Typical use |
|---|---|---|
| `/model-boosters` | ModelBooster | Operator happy path: deploy a model backend |
| `/model-servings` | ModelServing | Serving groups, replicas, scheduler |
| `/model-servers` | ModelServer | Inference engine + pod selector |
| `/model-routes` | ModelRoute | Request routing to ModelServers |

Each page follows the Jobs pattern: paginated table, YAML create/edit, delete confirm, and a detail dialog with status and YAML.

## Related resources

From a detail dialog you can jump to linked objects (`?ns=` and `name=` on the target page):

- **ModelBooster** → owned ModelServing, ModelServer, ModelRoute
- **ModelServing** → owner ModelBooster, Pods (`modelserving.volcano.sh/name`), PodGroups, Queue (`scheduling.volcano.sh/queue-name`)
- **ModelServer** → Pods matching `spec.workloadSelector.matchLabels`, ModelRoutes that target this server
- **ModelRoute** → ModelServers in `targetModels`; Gateway `parentRefs` as text (there is no Gateway page)

Empty related lists show **None**, not an error.

## YAML

Create and edit stay YAML-first. Example manifests live in the Kthena repo under `examples/`. Kind, apiVersion, metadata.name, and spec are required. ModelRoute needs `modelName` or `loraAdapters`. ModelServer needs `inferenceEngine` and `workloadSelector`.
