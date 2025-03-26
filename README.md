# Volcano dashboard

### Overview

The volcano dashboard provides a basic dashboard that can be easily deployed in your kubernetes cluster to show the status of resources including volcano jobs, queues, pods, etc.

<img src="docs/images/demo.gif" alt="volcano dashboard" style="zoom:50%;" />

### Getting Started

Make sure [`node.js`](https://nodejs.org/en/download) is installed on your system and we prefer [`visual-studio-code`](https://code.visualstudio.com/download) as IDE.

### Prerequisites

Please follow the [guide](https://github.com/volcano-sh/volcano#quick-start-guide) to install volcano first.

### Install volcano dashboard

Login one node of your kubernetes cluster and execute the following command to install volcano dashboard.

```bash
kubectl create ns volcano-system

kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

Then use the following command to map the traffic to node.

```bash
kubectl port-forward svc/volcano-dashboard 8080:80 -n volcano-system --address 0.0.0.0
```

Access the dashboard by navigate to `http://$YOUR_NODE_IP:8080` in your browser.

If running locally navigate to `http://localhost:8080`


## Design

You can follow the [design doc](docs/design.md) to learn more about the design details.

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).
