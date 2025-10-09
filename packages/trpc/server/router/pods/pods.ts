import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { k8sCoreApi } from "../../utils/k8s";
import { fetchPods } from "../helpers";
import { createPodInputSchema, deletePodInputSchema, getPodsInputSchema, getPodYamlInputSchema, updatePodInputSchema } from "./schema";

export const podRouter = router({
    getPods: procedure.input(getPodsInputSchema).query(async ({ input }) => {
        const {
            page = 1,
            pageSize = 10,
        } = input;
        console.log("Fetching pods with params:", {
            page,
            pageSize,
        });

        const result = await fetchPods(
            page,
            pageSize,
        );

        return result;
    }),
    getPodYaml: procedure
        .input(getPodYamlInputSchema)
        .query(async ({ input }) => {
            const { namespace, name } = input;
            const response = await k8sCoreApi.readNamespacedPod({
                name,
                namespace,
            });

            const formattedYaml = yaml.dump(response, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false,
            });

            return formattedYaml;
        }),
    getAllPods: procedure.query(async () => {
        const response = await k8sCoreApi.listNamespacedPod({
            namespace: "default",
        });
        return {
            items: response.items,
            totalCount: response.items.length,
        };
    }),
    createPod: procedure.input(createPodInputSchema).mutation(async ({ input }) => {
        const { podManifest } = input;

        const response = await k8sCoreApi.createNamespacedPod({
            namespace: podManifest.metadata.namespace || "default",
            body: podManifest,
        });

        return {
            message: "Pod created successfully",
            data: response,
        };
    }),
    updatePod: procedure.input(updatePodInputSchema).mutation(async ({ input }) => {
        const { namespace, name, patchData } = input;

        // First, get the current pod to preserve metadata like resourceVersion
        const currentPod = await k8sCoreApi.readNamespacedPod({
            name,
            namespace,
        });

        // For pods, we can only update specific fields per Kubernetes restrictions
        // Extract only the allowed changes from patchData
        const updatedSpec: any = {
            ...currentPod.spec,
        };

        // Update container images and imagePullPolicy if provided
        if (patchData.spec?.containers) {
            updatedSpec.containers = currentPod.spec?.containers?.map((container: any, index: number) => {
                const patchContainer = patchData.spec.containers[index];
                if (!patchContainer) return container;

                return {
                    ...container,
                    ...(patchContainer.image && { image: patchContainer.image }),
                    ...(patchContainer.imagePullPolicy && { imagePullPolicy: patchContainer.imagePullPolicy }),
                };
            });
        }

        if (patchData.spec?.initContainers && currentPod.spec?.initContainers) {
            updatedSpec.initContainers = currentPod.spec.initContainers.map((container: any, index: number) => {
                const patchContainer = patchData.spec.initContainers?.[index];
                return patchContainer?.image ? { ...container, image: patchContainer.image } : container;
            });
        }

        if (patchData.spec?.activeDeadlineSeconds !== undefined) {
            updatedSpec.activeDeadlineSeconds = patchData.spec.activeDeadlineSeconds;
        }
        if (patchData.spec?.terminationGracePeriodSeconds !== undefined) {
            updatedSpec.terminationGracePeriodSeconds = patchData.spec.terminationGracePeriodSeconds;
        }

        const updatedPod = {
            ...currentPod,
            metadata: {
                ...currentPod.metadata,
                resourceVersion: currentPod.metadata?.resourceVersion,
                uid: currentPod.metadata?.uid,
                creationTimestamp: currentPod.metadata?.creationTimestamp,
            },
            spec: updatedSpec,
        };

        const response = await k8sCoreApi.replaceNamespacedPod({
            name,
            namespace,
            body: updatedPod,
        });

        return {
            message: "Pod updated successfully",
            data: response,
        };
    }),
    deletePod: procedure.input(deletePodInputSchema).mutation(async ({ input }) => {
        const { namespace, name } = input;

        const response = await k8sCoreApi.deleteNamespacedPod({
            name,
            namespace,
        });

        return {
            message: "Pod deleted successfully",
            data: response,
        };
    }),
});
