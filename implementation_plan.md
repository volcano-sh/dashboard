# Implementation Plan - Multi-cluster Support and Backend Architecture Modernization

This plan outlines the steps to refactor the monolithic `server.js` and implement multi-cluster support.

## Phase 1: Backend Modularization
1. **Create Directory Structure**:
   - `backend/src/routes/`
   - `backend/src/controllers/`
   - `backend/src/services/`
   - `backend/src/middleware/`

2. **Develop Services**:
   - `backend/src/services/k8sService.js`: Encapsulate all `@kubernetes/client-node` logic. This will handle `list`, `get`, `patch`, `create`, and `delete` operations for Pods, Jobs, PodGroups, Queues, and Namespaces.
   - `backend/src/services/clusterService.js`: Manage multi-cluster configurations (reading kubeconfigs, maintaining active contexts).

3. **Develop Controllers**:
   - `backend/src/controllers/jobController.js`
   - `backend/src/controllers/podController.js`
   - `backend/src/controllers/queueController.js`
   - `backend/src/controllers/namespaceController.js`
   - `backend/src/controllers/podGroupController.js`

4. **Define Routes**:
   - `backend/src/routes/jobRoutes.js`
   - `backend/src/routes/podRoutes.js`
   - `backend/src/routes/queueRoutes.js`
   - `backend/src/routes/namespaceRoutes.js`
   - `backend/src/routes/podGroupRoutes.js`

5. **Update `server.js`**:
   - Remove monolithic handlers.
   - Use `express.Router()` to mount the new routes.
   - Add centralized error handling middleware.

## Phase 2: Multi-cluster Support
1. **Backend Implementation**:
   - Add `/api/v1/clusters` endpoints to list available clusters from a configured directory or the default kubeconfig.
   - Update `k8sService` to accept a `clusterContext` parameter to switch between clients dynamically.
2. **Frontend Implementation**:
   - Create `ClusterSelector` component.
   - Add global state for `currentCluster`.
   - Update all data fetching hooks/components to pass the cluster context or re-fetch on cluster change.

## Phase 3: Testing & Validation
- Run existing tests (if any).
- Manual verification of all dashboard views.
- Verify multi-cluster switching logic.

---

# Implementation Plan - Interactive Observability Suite

(To be executed after Phase 1 & 2)

## Phase 1: Real-time Log Streaming
1. **Backend**:
   - Add `/api/v1/pods/:namespace/:name/logs/stream` using Server-Sent Events (SSE).
2. **Frontend**:
   - Create `LogConsole` component.
   - Integrate into `PodDetailsDialog`.

## Phase 2: Interactive Terminal
1. **Backend**:
   - Add WebSocket proxy for `kubectl exec`.
2. **Frontend**:
   - Integrate `xterm.js`.
   - Add "Terminal" tab to `PodDetailsDialog`.
