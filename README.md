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
- [Volcano](https://github.com/volcano-sh/volcano) installed on your cluster (see [Install Volcano](#install-volcano) below if needed)

### Install from the published manifest

This deploys the default image (`volcanosh/volcano-dashboard:latest`) from the manifest.

1. Create the `volcano-system` namespace (if it does not exist):

```bash
kubectl create ns volcano-system --dry-run=client -o yaml | kubectl apply -f -
```

2. Deploy the volcano dashboard:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

3. Access the dashboard by port-forwarding the service:

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80 --address 0.0.0.0
```

4. Open your browser:
   - Local: [http://localhost:8080](http://localhost:8080)
   - Remote: `http://<NODE_IP>:8080` (replace `<NODE_IP>` with your node IP)

### Install with a locally built image

Use this when you want to run your own build instead of the published image (for example on [kind](https://kind.sigs.k8s.io/)).

1. Build the image from the repository root:

```bash
docker build -f deployment/Dockerfile -t dashboard-app:dev .
```

2. Load the image into your cluster (kind example):

```bash
kind load docker-image dashboard-app:dev --name kind
```

3. Deploy dashboard resources:

```bash
kubectl create ns volcano-system --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f deployment/volcano-dashboard.yaml
```

4. Point the deployment at your local image (replaces the default without editing YAML):

```bash
kubectl -n volcano-system set image deploy/volcano-dashboard \
  volcano-dashboard=dashboard-app:dev
kubectl -n volcano-system rollout status deploy/volcano-dashboard
```

5. [Install Volcano](#install-volcano) if it is not already on the cluster.

6. Access the dashboard:

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80
```

Open [http://localhost:8080](http://localhost:8080).

For minikube, Docker-only workflows, and other cluster types, see [CONTRIBUTING.md](CONTRIBUTING.md#deploy-to-a-local-kubernetes-cluster-kind).

### Install Volcano

The dashboard requires Volcano CRDs and controllers. If they are not installed yet:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/volcano/master/installer/volcano-development.yaml
```

Verify the APIs are available:

```bash
kubectl api-resources | grep -E "batch.volcano.sh|scheduling.volcano.sh"
kubectl get jobs.batch.volcano.sh -A
kubectl get queues.scheduling.volcano.sh
kubectl get podgroups.scheduling.volcano.sh -A
```

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).

## Development Notes (Saved Views & Audit)

This repository now includes two user-facing features used during development and testing:

- Saved dashboard views: the table component supports saving, loading and deleting custom table views (filters/columns/pagination) from the table UI on Jobs, Queues, and Pods pages.
- Audit / Activity History (Phase‑1): a lightweight audit service records CREATE/UPDATE/DELETE events for Jobs and Queues and exposes an Activity/Audit UI in the dashboard.

Audit persistence
- Primary storage: `better-sqlite3` (SQLite) with database at `packages/trpc/server/data/audit.db` when available.
- Fallback: an in-memory store is used when the native module cannot be loaded; events exist only for the running process.

If you run into native build/runtime issues for `better-sqlite3` on Windows, you can force the in-memory fallback to avoid blocking development.

Run the app locally (recommended with in-memory fallback)

1. Install dependencies (from the repo root):

```bash
cd "C:/Users/HP/Desktop/dashboard Ui/-New-dashboard-Ui"
npm install
```

2. Start the dev server with the in-memory audit fallback (PowerShell):

```powershell
$env:AUDIT_FORCE_IN_MEMORY = "1"
npm run dev
```

Or CMD:

```cmd
set AUDIT_FORCE_IN_MEMORY=1&& npm run dev
```

Notes:
- `npm run dev` uses Turbo to run workspace dev tasks and will start the Next.js dev server for `apps/web`.
- With `AUDIT_FORCE_IN_MEMORY=1` set, the app will not attempt to load `better-sqlite3` and will use the in-memory audit store.

Enable native SQLite (optional)

If you prefer persistent audit storage and want to use SQLite, you will need `better-sqlite3` to build successfully. On Windows this typically requires the Visual Studio Build Tools (C++ workload) and Python.

From `packages/trpc` try:

```bash
cd packages/trpc
# attempt to load; will print 'ok' on success or show the error
node -e "try{ require('better-sqlite3'); console.log('ok') }catch(e){ console.error(e.stack) }"

# if it fails, attempt a rebuild from source
npm rebuild better-sqlite3 --build-from-source
```

If rebuild errors reference missing toolchains, follow the error message guidance to install the required build tools, then re-run the rebuild.

Verify the audit DB file:

```powershell
Get-ChildItem -Path packages\trpc\server\data
```

UI pages
- Activity / Audit: open Dashboard → Activity or Dashboard → Audit in the running app to view recent audit events.
- Jobs / Queues / Pods: use the table UI to save/load table views and to perform create/update/delete actions which will generate audit events for Jobs and Queues.

If something fails to start, please paste the terminal output (last ~200 lines) and the result of the `node -e ...` test above and I will help diagnose further.

Suggested reviewers
- Frontend: reviewers familiar with `apps/web` UI components and `next-intl` to review Activity/Audit UI changes and runtime sanitizers.
- Backend: one reviewer to sanity-check the small `audit.ts` change and confirm the persistence and fallback behavior (SQLite primary, in-memory fallback with visible warning).

Notes and follow-ups
- Runtime validation: the UI includes lightweight runtime sanitizers for audit responses. Server-side schema validation (e.g., using `zod` in the tRPC router) is recommended as a follow-up and is tracked separately.
