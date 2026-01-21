# Volcano Dashboard

## Overview

The Volcano Dashboard provides a web-based user interface to monitor and manage resources in your Volcano-enabled Kubernetes cluster. This dashboard allows you to visualize and interact with Volcano jobs, queues, pods, and other related resources, making it easier to monitor workload status and troubleshoot issues.

![Volcano Dashboard Demo](docs/images/demo.gif)

## Prerequisites

Before installing the Volcano Dashboard, ensure you have the following prerequisites:

1. **Kubernetes Cluster** - A running Kubernetes cluster (v1.16+)
2. **kubectl** - The Kubernetes command-line tool, configured to communicate with your cluster
3. **Node.js** - Installed on your local development system if you plan to contribute or modify the dashboard
4. **Visual Studio Code** - Recommended IDE for development (optional)
5. **Volcano Scheduler** - Volcano must be installed in your cluster prior to setting up the dashboard

## Installation

### Step 1: Install Volcano Scheduler

The Volcano Dashboard requires Volcano to be installed first. Follow these steps to install Volcano:

1. Visit the [Volcano Installation Guide](https://volcano.sh/en/docs/installation/) for detailed instructions
2. Alternatively, you can install Volcano with the following commands:

```bash
# Download the latest Volcano release
$ kubectl apply -f https://raw.githubusercontent.com/volcano-sh/volcano/master/installer/volcano-development.yaml

# Verify the installation
$ kubectl get pods -n volcano-system
```

Make sure all Volcano components are running successfully before proceeding.

### Step 2: Install Volcano Dashboard

Once Volcano is properly installed and running, you can deploy the Volcano Dashboard:

1. Create a dedicated namespace for the dashboard:

```bash
kubectl create ns volcano-system
```

2. Deploy the dashboard:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

3. Map the dashboard service to make it accessible:

```bash
kubectl port-forward svc/volcano-dashboard 8080:80 -n volcano-system --address 0.0.0.0
```

### Step 3: Access the Dashboard

Access the dashboard by navigating to:
- If running on your local machine: http://localhost:8080
- If running on a remote server: http://${YOUR_NODE_IP}:8080


## Development

If you're interested in contributing to the Volcano Dashboard, follow these steps:

1. Clone the repository:
```bash
git clone https://github.com/volcano-sh/dashboard.git
cd dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Run the dashboard locally:
```bash
npm start
```

4. Build the dashboard:
```bash
npm run build
```

## Security

The Volcano Dashboard requires appropriate RBAC permissions to access Volcano and Kubernetes resources. The default installation includes necessary roles and role bindings, but you may need to adjust them based on your security requirements.

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
   - For local access: `http://localhost:8080`
   - For remote access: `http://<NODE_IP>:8080` (replace `<NODE_IP>` with your Kubernetes node's IP address)

## Contributing

Contributions to the Volcano Dashboard are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Additional Resources

- [Volcano Scheduler Documentation](https://volcano.sh/en/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Design Documentation](docs/design.md)
