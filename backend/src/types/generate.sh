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
