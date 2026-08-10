# Volcano Dashboard Design

## Overview

Volcano Dashboard is a full-stack web application for viewing and managing
Kubernetes and Volcano resources. It is organized as an npm workspace managed by
Turborepo, with a Next.js application for both the user interface and API.

## Architecture

```text
Browser → Next.js UI → tRPC API → Kubernetes client → Kubernetes API
```

The browser renders React components and sends type-safe requests to the tRPC
endpoint at `/api/trpc`. The API runs in the same Next.js process and uses the
official Kubernetes Node.js client to communicate with the cluster. There is no
separate Express server or database; Kubernetes is the source of truth.

## Technology Stack

- **Application:** Next.js, React, and TypeScript
- **API and validation:** tRPC and Zod
- **Data fetching and caching:** TanStack Query
- **Kubernetes integration:** `@kubernetes/client-node`
- **User interface:** Tailwind CSS and Radix UI
- **Charts:** Recharts
- **Workspace tooling:** npm workspaces and Turborepo

## Code Organization

- `apps/web` contains the Next.js pages, dashboard and shared UI components,
  and the `/api/trpc` route handler.
- `packages/trpc` contains the typed clients, domain routers, Zod schemas,
  validation helpers, and Kubernetes client configuration.
- `deployment` contains the production Dockerfile and Kubernetes manifests for
  the Deployment, Service, ServiceAccount, and RBAC resources.

## Main Modules

| Module | Function |
| --- | --- |
| Dashboard | Displays cluster, workload, and queue metrics |
| Jobs | Lists and manages Volcano Jobs |
| Queues | Lists and manages Volcano Queues |
| Pods | Lists and manages Kubernetes Pods |
| PodGroups | Lists and inspects Volcano PodGroups |

Resource lists support pagination, and resource details can be displayed as
YAML.

## Data Flow

1. A user opens a dashboard page or performs an action in the browser.
2. The React client sends a typed tRPC query or mutation to `/api/trpc`.
3. The tRPC router validates the input and calls the Kubernetes API through
   `@kubernetes/client-node`.
4. Kubernetes authenticates the configured identity and applies RBAC rules.
5. The API returns the result, TanStack Query updates its cache, and React
   refreshes the affected interface.

Volcano Jobs use `batch.volcano.sh/v1alpha1`. Queues and PodGroups use
`scheduling.volcano.sh/v1beta1`, while Pods use the core Kubernetes API.

## Deployment

During local development, the Kubernetes client loads credentials from the
default kubeconfig. `K8S_SERVER` can override the API server address, and
`K8S_SKIP_TLS_VERIFY=true` can be used with self-signed local clusters.

In Kubernetes, a single container serves both the web interface and the tRPC
API. The pod uses its ServiceAccount to access the Kubernetes API, and the
associated RBAC rules determine which cluster operations are permitted.

## Security and Access

The application currently has no application-level authentication. Access to
cluster resources depends on the Kubernetes identity configured for the server
and the permissions granted to that identity through Kubernetes RBAC.

The UI and tRPC API implement Pod creation, updates, and deletion, but the
standard deployment grants Pods only `get`, `list`, and `watch` permissions.
These mutations are rejected in-cluster unless an administrator extends the
dashboard's RBAC permissions.
