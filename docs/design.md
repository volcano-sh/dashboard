### 1. Backend Architecture

- Build backend server using Node.js and Express.js
- Expose REST API endpoints under `/api` for frontend resource requests
- Use the Kubernetes JavaScript client (`@kubernetes/client-node`) to communicate with the configured Kubernetes cluster
- Use `CustomObjectsApi` for Volcano custom resources such as Jobs, Queues, and PodGroups
- Use `CoreV1Api` for Kubernetes core resources such as Pods and Namespaces
- Provide RESTful API interfaces to retrieve resources such as Jobs, Queues, Pods, PodGroups, and Namespaces
- Provide create, update, and delete operations for supported resources
- Provide YAML endpoints for supported resources so users can inspect Kubernetes-style resource definitions

### 2. Frontend Technology Stack

- Adopt React.js framework to build a Single Page Application (SPA)
- Use Vite for frontend development and build tooling
- Use Material UI component library to design a modern, responsive user interface
- Use React Router for frontend route management and dynamic page rendering
- Use Chart.js and `react-chartjs-2` for dashboard charts and visual summaries
- Use Monaco Editor for YAML editing experiences where supported

### 3. Data Flow and Interaction

- Frontend sends requests to backend REST APIs as needed to obtain the latest cluster resource data
- Backend retrieves Volcano and Kubernetes resource information from the configured Kubernetes cluster and returns it to the frontend
- Frontend receives JSON or YAML data and dynamically updates the UI without requiring a full page refresh
- Resource pages support common interactions such as listing, searching, filtering, pagination, detail views, and YAML views where supported
- Management operations such as creating, updating, or deleting resources are handled through backend APIs where supported by the dashboard

### 4. User Interface Layout

- Adopt an application layout with:
  - Top application bar
  - Collapsible left navigation drawer
  - Main content display area
  - Volcano logo section in the sidebar
- Left navigation bar includes five main functional options:
  1. Dashboard
  2. Jobs
  3. Queues
  4. Pods
  5. PodGroups
- Right content area dynamically displays the selected page based on the current React Router route

### 5. Main Functional Modules

| Module | Functionality Description |
|--------|---------------------------|
| Dashboard | Provides a high-level overview of cluster resources, including jobs, queues, pods, status summaries, and charts. |
| Jobs | Displays Volcano jobs and their statuses, with support for filtering, details, YAML view, and management actions where supported. |
| Queues | Displays Volcano queues, with support for filtering, YAML view, and management actions where supported. |
| Pods | Displays Kubernetes pods, with support for namespace filtering, status filtering, search, and YAML view. |
| PodGroups | Displays Volcano PodGroups, with support for namespace filtering, status filtering, search, detail view, and YAML view. |

### 6. Deployment and Permissions

- Deploy the dashboard into the `volcano-system` namespace using the Kubernetes manifests in `deployment/volcano-dashboard.yaml`
- Run frontend and backend containers as part of the `volcano-dashboard` Deployment
- Expose the dashboard through the `volcano-dashboard` Service
- Use a dedicated `volcano-dashboard` ServiceAccount for in-cluster Kubernetes API access
- Use ClusterRole and ClusterRoleBinding resources to grant the dashboard access to required Volcano and Kubernetes resources
- Current permissions include read access to Volcano Jobs, Queues, PodGroups, Kubernetes Pods, and Namespaces, with create and delete permissions for Jobs and create, update, patch, and delete permissions for Queues
