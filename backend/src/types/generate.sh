check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ $1 is NOT installed. Please install it."
        exit 1
    fi
}

# # Check required commands
check_command kubectl
check_command jq
check_command openapi-typescript

kubectl get crd jobs.batch.volcano.sh -o json | jq '{
    openapi: "3.0.0",
    info: { title: "Volcano Job API", version: "v1alpha1" },
    paths: {},
    components: { 
        schemas: { 
            "Job": .spec.versions[0].schema.openAPIV3Schema 
        } 
    }
}' | openapi-typescript -o ./src/types/job.d.ts

kubectl get crd queues.scheduling.volcano.sh -o json | jq '{
    openapi: "3.0.0",
    info: { title: "Volcano Job API", version: "v1alpha1" },
    paths: {},
    components: { 
        schemas: { 
            "Queue": .spec.versions[0].schema.openAPIV3Schema 
        } 
    }
}' | openapi-typescript -o ./src/types/queue.d.ts

echo "Generated types for Volcano Job API"
