### 1. Backend Architecture

- Build backend server using Node.js and Express.js, listening on a specific port
- Utilize OpenAPI Generator to generate JavaScript-based API client code from Kubernetes (k8s) API specifications
- Implement seamless communication between local and Volcano-deployed K8s clusters
- Provide RESTful API interfaces to support retrieval of resources such as Jobs, Queues, Nodes, etc.

### 2. Frontend Technology Stack

- Adopt React.js framework to build a Single Page Application (SPA)
- Use Material-UI component library to design a modern, responsive user interface
- Implement dynamic rendering and frontend route management through React Router

### 3. Data Flow and Interaction

- Frontend sends requests to the backend as needed via API to obtain the latest cluster resource data
- Backend retrieves Volcano-related resource information from the local Kubernetes cluster and returns it to the frontend
- Frontend receives data and dynamically updates the UI without requiring a full page refresh

### 4. User Interface Layout

- Adopt a two-column design:
  - Left side for navigation bar
  - Right side for content display area
- Left navigation bar includes four main functional options:
  1. Dashboard
  2. Queue
  3. Job
  4. Node
- Right content area dynamically displays corresponding resource information based on user selection

### 5. Main Functional Modules

| Module | Functionality Description |
|--------|---------------------------|
| Dashboard | Provides cluster resource overview |
| Queue | Displays and manages Volcano queue resources |
| Job | Shows all Volcano jobs and their statuses (e.g., Running, Failed, Pending, Completed, etc.) |
| Node | Displays cluster node information and resource usage |