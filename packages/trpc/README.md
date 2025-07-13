# Volcano Backend Code Documentation

This document provides instructions to set up, run, and understand the backend server code for the Volcano project.


## Prerequisites

Ensure you have the following installed on your system:

- Node.js (v16 or higher)
- npm (v8 or higher)
- A running Kubernetes cluster with Volcano installed
- kubectl configured to access your cluster

## Installation

Follow these steps to set up the project:

1. Clone the repository to your local machine:
    ```shell
    git clone https://github.com/volcano-sh/volcano-dashboard.git
    cd volcano-dashboard
    ```

2. Install the necessary dependencies:
    ```shell
    npm install
    ```

3. Configure environment variables:
    ```shell
    cp .env.example .env
    ```
    Edit .env to set any required configuration values

## Running the Server

The backend server can be started in two ways:

1. Run only the backend:
    ```shell
    npm run backend
    ```

2. Run both frontend and backend concurrently:
    ```shell
    npm run dev
    ```

The server will start on port 3001 by default.

## API Overview

The backend provides a tRPC API with the following main endpoints:

- Queues: Manage Volcano queues (list, get details)
  - getQueues: Get paginated list of queues with search and filtering
  - getQueueYaml: Get YAML representation of a specific queue
  - getAllQueues: Get complete list of queues without pagination
- Pods: List and filter pods across namespaces
  - getPods: Get filtered list of pods with namespace and status filtering
- Jobs: Manage Volcano jobs
  - getJobs: Get paginated list of jobs with filtering options
  - getJobDetails: Get detailed information about a specific job

The API uses the official Kubernetes client (@kubernetes/client-node) to interact with the cluster. For more information on the Kubernetes client, refer to the [Kubernetes API Client documentation](docs/kubernetes_api_client.md).

## Adding a New tRPC Router

To add a new tRPC router:

1. Create a new file in `src/api/router/your-feature/your-feature.ts`:
    ```typescript
    import { router, procedure } from '../../trpc';
    
    export const yourFeatureRouter = router({
      yourEndpoint: procedure
        .input(/* your zod schema */)
        .query(async ({ input }) => {
          // Your endpoint logic here
          return { data: 'your response' };
        }),
    });
    ```

2. Add your router to `src/api/router/index.ts`:
    ```typescript
    import { yourFeatureRouter } from './your-feature/your-feature';
    
    export const appRouter = router({
      yourFeature: yourFeatureRouter,
    });
    ```




