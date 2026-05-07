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
   - For local access: `http://localhost:8080`
   - For remote access: `http://<NODE_IP>:8080` (replace `<NODE_IP>` with your Kubernetes node's IP address)

## Local Development

If you'd like to run the dashboard locally for development or contribution purposes, follow these steps:

### Prerequisites

- Node.js (v18+ recommended)
- `npm` or `yarn`
- A running Kubernetes cluster with `kubeconfig` configured locally.
- Volcano installed on your cluster.

### Setup

1. **Clone the repository:**

```bash
git clone https://github.com/volcano-sh/dashboard.git
cd dashboard
```

2. **Install Dependencies:**
The project uses npm workspaces to manage both frontend and backend dependencies.

```bash
npm install
```

3. **Configure Environment Variables (Optional):**
You can configure environment variables by creating `.env` files in the respective workspaces:

```bash
# Create a backend env file (e.g. to change the default PORT)
cp backend/.env.example backend/.env
```

4. **Start the Development Servers:**
This command will concurrently start both the backend API server and the frontend Vite development server.

```bash
npm run dev
```

The frontend will be accessible at `http://localhost:3000` and the backend at `http://localhost:3001`. The backend uses your local `~/.kube/config` by default to interact with the Kubernetes cluster.

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).
