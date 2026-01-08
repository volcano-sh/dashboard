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

1. Create the volcano-system namespace (if it doesn't exist):

```bash
kubectl create ns volcano-system
```

2. Deploy the volcano dashboard:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

3. Access the dashboard by port-forwarding the service:

```bash
kubectl port-forward svc/volcano-dashboard 8080:80 -n volcano-system --address 0.0.0.0
```

4. Open your browser and navigate to:
   - For remote access: `http://$YOUR_NODE_IP:8080`
   - For local access: `http://localhost:8080`

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).
