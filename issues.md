# Proposed Issues for Volcano Dashboard

## Issue 1: [FEATURE] Multi-cluster Support and Backend Architecture Modernization
**Title:** [FEATURE] Implement Multi-cluster Context Management and Modular Backend Refactoring
**Description:**
Currently, the Volcano Dashboard is designed for single-cluster operation and the backend logic is centralized in a monolithic `server.js` file exceeding 1,000 lines. This creates a significant bottleneck for enterprise users who manage multiple Volcano clusters and complicates long-term maintenance.

**Objective:**
This issue proposes a major architectural transformation to support multi-cluster management while simultaneously refactoring the backend into a modern, scalable structure.

**Proposed Scope:**
- **Backend Refactoring (Architectural Overhaul):**
  - Modularize the monolithic `server.js` into `routes`, `controllers`, and `services` directories.
  - Implement a dedicated `K8sService` layer to abstract Kubernetes API calls.
  - Introduce request validation, structured logging, and centralized error handling middleware.
- **Multi-cluster Foundation:**
  - Enhance the backend to support dynamic loading and switching between multiple `kubeconfigs`.
  - Create internal state management for cluster registries (dynamic addition/removal of cluster contexts).
- **Frontend Integration:**
  - Design and implement a `ClusterSelector` component in the global navigation bar.
  - Update the Redux/Context state to maintain the active cluster context across all pages.
  - Ensure all resource views (Jobs, Pods, Queues) refresh dynamically upon cluster switching.

**Impact:**
This is a high-impact initiative that will touch nearly every file in the backend and significantly update the frontend layout. It provides the essential foundation for enterprise-grade Volcano management.

---

## Issue 2: [FEATURE] Interactive Observability Suite: Real-time Pod Logs and Web Terminal
**Title:** [FEATURE] Implementation of Real-time Log Streaming and Interactive Web Terminal (Exec)
**Description:**
The current dashboard lacks deep observability features. Users can view resource YAMLs but cannot monitor real-time execution or interact with running containers. This forces users back to the CLI for debugging, reducing the dashboard's utility.

**Objective:**
Implement a comprehensive observability suite within the dashboard to provide a "single pane of glass" experience for Volcano workload debugging.

**Proposed Scope:**
- **Real-time Pod Log Streaming:**
  - **Backend:** Implement Server-Sent Events (SSE) or WebSocket endpoints to pipe logs directly from the Kubernetes API `watch` interface.
  - **Frontend:** Create a high-performance `LogViewer` component featuring auto-scroll, full-text search, and multi-container selection support.
- **Interactive Web Terminal (Exec):**
  - **Backend:** Build a WebSocket proxy to bridge the web-based shell with the Kubernetes `remotecommand` (exec) API.
  - **Frontend:** Integrate `xterm.js` to provide a robust, interactive terminal experience for direct container interaction.
- **Observability Integration:**
  - Add "Logs" and "Terminal" tabs to the Pod and Job details dialogs for seamless access.

**Impact:**
This feature adds significant technical complexity and value to the dashboard. It involves advanced backend streaming logic and specialized frontend components, resulting in a substantial volume of new code and enhanced user experience.
