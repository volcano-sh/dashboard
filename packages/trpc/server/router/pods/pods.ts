import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { k8sCoreApi } from "../../utils/k8s";
import { fetchPods } from "../helpers";
import { createPodInputSchema, deletePodInputSchema, getPodsInputSchema, getPodYamlInputSchema, updatePodInputSchema } from "./schema";

type ContainerLike = { name?: string; image?: string; imagePullPolicy?: string };

/**
 * Merges submitted container fields into the existing containers by `name`,
 * not array position. Kubernetes containers have stable identity through
 * `name`; `spec.containers` ordering carries no identity meaning, so a
 * user-submitted list with a different order must not be zipped positionally
 * against the existing list (see issue #372).
 *
 * Existing containers not present in `submitted` are returned unchanged.
 * Submitted entries with no matching existing container are ignored, same as
 * the previous out-of-range behavior for extra positional entries.
 */
export function mergeContainersByName<T extends ContainerLike>(
    existing: T[] | undefined,
    submitted: ContainerLike[] | undefined,
    fields: Array<"image" | "imagePullPolicy">,
): T[] {
    if (!existing) return [];
    if (!submitted) return existing;

    const submittedByName = new Map<string, ContainerLike>();
    for (const container of submitted) {
        if (container?.name) {
            submittedByName.set(container.name, container);
        }
    }

    return existing.map((container) => {
        const patchContainer = container.name ? submittedByName.get(container.name) : undefined;
        if (!patchContainer) return container;

        const updates: Partial<ContainerLike> = {};
        for (const field of fields) {
            if (patchContainer[field]) {
                updates[field] = patchContainer[field];
            }
        }

        return { ...container, ...updates };
    });
}

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

        return fetchPods(page, pageSize);
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

        // Update container images and imagePullPolicy if provided, matched by name (not position)
        if (patchData.spec?.containers) {
            updatedSpec.containers = mergeContainersByName(
                currentPod.spec?.containers,
                patchData.spec.containers,
                ["image", "imagePullPolicy"],
            );
        }

        if (patchData.spec?.initContainers && currentPod.spec?.initContainers) {
            updatedSpec.initContainers = mergeContainersByName(
                currentPod.spec.initContainers,
                patchData.spec.initContainers,
                ["image"],
            );
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
