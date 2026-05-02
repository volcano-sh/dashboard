# Volcano dashboard

## Overview

The volcano dashboard provides a basic dashboard that can be easily deployed in your kubernetes cluster to show the status of resources including volcano jobs, queues, pods, etc.

<img src="docs/images/demo.gif" alt="volcano dashboard" style="zoom:50%;" />

## Design

You can follow the [design doc](docs/design.md) to learn more about the design details.

## Installation

### Prerequisites

Before installing the volcano dashboard, please ensure you have:
- A running Kubernetes cluster
- `kubectl` configured to access your cluster
- Volcano installed on your cluster (follow the [Volcano Quick Start Guide](https://github.com/volcano-sh/volcano#quick-start-guide))

### Install Volcano Dashboard

Create the volcano-system namespace (if it doesn't exist):

```bash
kubectl create ns volcano-system
```

Deploy the volcano dashboard:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

### Installing Volcano Dashboard via helm charts

To install the volcano dashboard with chart:

```bash
helm install <specified-name> ./installer/helm/chart/volcano-dashboard --namespace <namespace> --create-namespace

e.g :
helm install volcano-dashboard ./installer/helm/chart/volcano-dashboard --namespace volcano-system --create-namespace
```

This command deploys volcano dashboard in kubernetes cluster with default configuration.  The [configuration](#configuration) section lists the parameters that can be configured during installation.

To list the volcano dashboard chart:

```bash
helm list -n <namespace>

e.g:
 helm list -n volcano-system
```

### Uninstalling the Chart

```bash
$ helm delete volcano-dashboard -n volcano-system
```

### Configuration

The following are the list configurable parameters of Volcano Dashboard Chart and their default values.

| Parameter|Description|Default Value|
|----------------|-----------------|----------------------|
|`basic.frontend_image_name`|Frontend Docker Image Name|`volcanosh/vc-dashboard-frontend`|
|`basic.backend_image_name`|Backend Docker Image Name|`volcanosh/vc-dashboard-backend`|
|`basic.image_tag_version`|Docker image version Tag|`latest`|
|`basic.frontend_image_tag_version`|Override tag for the frontend only|`""`|
|`basic.backend_image_tag_version`|Override tag for the backend only|`""`|
|`basic.image_registry`|Container image registry|`docker.io`|
|`basic.image_pull_policy`|Image Pull Policy|`Always`|
|`basic.image_pull_secret`|Image Pull Secret|`""`|
|`custom.dashboard_replicas`|The number of dashboard pods to run|`1`|
|`custom.dashboard_enable`|Enable / disable the whole deployment|`true`|
|`custom.service_type`|Kubernetes service type|`ClusterIP`|
|`custom.frontend_node_port`|NodePort for frontend|`~`|
|`custom.backend_node_port`|NodePort for backend|`~`|
|`custom.default_sc`|Default securityContext for dashboard pods|`~`|
|`custom.default_csc`|Container security context defaults|`~`|
|`custom.frontend_csc`|Per-container security context overrides for frontend|`~`|
|`custom.backend_csc`|Per-container security context overrides for backend|`~`|
|`custom.frontend_resources`|Resource requests/limits for the frontend container|`~`|
|`custom.backend_resources`|Resource requests/limits for the backend container|`~`|
|`custom.dashboard_ns`|Node selector for the dashboard pod|`~`|
|`custom.dashboard_affinity`|Affinity rules for the dashboard pod|`~`|
|`custom.dashboard_tolerations`|Tolerations for the dashboard pod|`~`|
|`custom.common_labels`|Additional labels for all Helm chart objects|`~`|
|`custom.dashboard_labels`|Additional labels for the Deployment object|`~`|
|`custom.dashboard_pod_labels`|Additional labels for Dashboard pods|`~`|
|`service.ipFamilyPolicy`|Settings service the family policy|`""`|
|`service.ipFamilies`|Settings service the address families|`[]`|

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```bash
$ helm install volcano-dashboard --set custom.service_type=NodePort ./installer/helm/chart/volcano-dashboard -n volcano-system
```

The above command set service type to `NodePort`, so the dashboard can be accessed via Node IP directly.

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```bash
$ helm install volcano-dashboard -f values.yaml ./installer/helm/chart/volcano-dashboard -n volcano-system
```

> **Tip**: You can use the default [values.yaml](installer/helm/chart/volcano-dashboard/values.yaml)

### Access the dashboard

Access the dashboard by port-forwarding the service:

```bash
kubectl port-forward svc/volcano-dashboard 8080:80 -n volcano-system --address 0.0.0.0
```

Then open your browser and navigate to:
- For local access: `http://localhost:8080`
- For remote access: `http://<NODE_IP>:8080` (replace `<NODE_IP>` with your Kubernetes node's IP address)

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).
