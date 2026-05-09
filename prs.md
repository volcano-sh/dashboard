# Proposed Pull Requests for Volcano Dashboard

## PR 1: feat: multi-cluster support and backend architectural refactor
**Title:** feat: implement multi-cluster context management and modular backend refactor
**Description:**
This PR addresses the critical need for multi-cluster support and resolves the technical debt associated with the monolithic backend architecture. It completely modularizes the backend and introduces a dynamic cluster switching mechanism.

**Key Changes:**
- **Refactoring:** Decomposed the 1,000+ line `server.js` into a structured hierarchy:
  - `backend/src/routes/`: Organized API endpoints by resource type.
  - `backend/src/controllers/`: Encapsulated request handling and logic.
  - `backend/src/services/`: Centralized Kubernetes API interactions.
- **Multi-cluster Core:**
  - Implemented `ClusterManager` service to handle multiple kubeconfigs.
  - Added `/api/v1/clusters` management endpoints.
- **UI Enhancement:**
  - Integrated `ClusterSelector` in the header for real-time context switching.
  - Updated global state management to ensure cluster-aware data fetching.
- **Stability:** Added initial unit tests for the new service layer.

**Impact:** Massive LoC changes, significant architectural improvement, and a highly requested enterprise feature.

---

## PR 2: feat: real-time pod log streaming and interactive web terminal
**Title:** feat: add real-time observability with log streaming and interactive terminal
**Description:**
This PR significantly enhances the dashboard's observability capabilities by adding real-time log streaming and a web-based terminal for pod interaction.

**Key Changes:**
- **Streaming Backend:**
  - Implemented SSE (Server-Sent Events) for efficient log streaming from the Kubernetes API.
  - Added a WebSocket proxy to support interactive `exec` sessions.
- **Observability Components:**
  - Developed a high-performance `LogConsole` component with search and follow functionality.
  - Integrated `xterm.js` for a native-feeling terminal experience in the browser.
- **UI/UX Integration:**
  - Added "Logs" and "Terminal" tabs to the Pod details view.
  - Implemented automatic reconnection logic for streaming sessions.

**Impact:** Major feature addition, complex backend-frontend integration, and high visibility for users debugging Volcano workloads.
