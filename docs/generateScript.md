# Script Explanation: `backend/src/types/generate.sh`
## Purpose
The `generate.sh` script is designed to generate TypeScript types for custom resources definition in a Kubernetes cluster related to Volcano (like jobs and queues). The script automates the process of fetching the latest OpenAPI specification for a CRD and generating its corresponding types.
## Prerequisites
Before running the script, ensure Volcano is installed, running in a cluster which kubeclt has default access to.  The following tools must be installed in your system for the script to run properly:
- **kubectl**: [https://kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/)
- **jq**: [https://kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/)
- **openapi-typescript**:[ https://kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/)

## How to Use
To run the `generate.sh` script, follow these steps:
1. Navigate to the backend directory:
    ```bash
    cd backend
    ```
2. Execute the script using the following command:
    ```bash
    npm run generate:types
    ```
This will fetch the latest OpenAPI specification and generate the TypeScript types for the Volcano CRDs.


## When to Use
You only need to run this script when there are changes to the CRD. Since CRD changes are rare, running `generate.sh` is not part of the regular project setup. It is only necessary when the CRD has been updated and  existing types have become invalid

## How It Works
1. **Fetch OpenAPI Specification**:  
   The script fetches the OpenAPI specification for the CRD directly from the Kubernetes cluster. This ensures that the fetched specification is always up-to-date and reflects the latest CRD changes.

2. **Generate Types**:  
   Using the fetched OpenAPI specification, the script generates TypeScript types for the resource.