import yaml from "js-yaml";
import { z } from "zod";

import { procedure } from "../../trpc";
import { formatK8sApiError } from "../../utils/k8s-errors";
import { k8sApi } from "../../utils/k8s";
import {
    createKthenaResource,
    deleteKthenaResource,
    getKthenaResource,
    type KthenaResourceDef,
    listKthenaResources,
    replaceKthenaResource,
} from "../../utils/kthena";
import { paginationInputSchema } from "../pagination";

const kthenaManifestSchema = z.object({
    apiVersion: z.string(),
    kind: z.string(),
    metadata: z.object({
        name: z.string().min(1),
        namespace: z.string().optional(),
        labels: z.record(z.string()).optional(),
        annotations: z.record(z.string()).optional(),
    }),
    spec: z.record(z.unknown()),
});

export const kthenaNameInputSchema = z.object({
    namespace: z.string().min(1),
    name: z.string().min(1),
});

export function kthenaCrudFields(resource: KthenaResourceDef) {
    return {
        list: procedure.input(paginationInputSchema).query(async ({ input }) => {
            const { page = 1, pageSize = 10 } = input;
            return listKthenaResources(k8sApi, resource, page, pageSize);
        }),
        get: procedure.input(kthenaNameInputSchema).query(async ({ input }) => {
            try {
                return await getKthenaResource(
                    k8sApi,
                    resource,
                    input.namespace,
                    input.name,
                );
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
        getYaml: procedure.input(kthenaNameInputSchema).query(async ({ input }) => {
            try {
                const result = await getKthenaResource(
                    k8sApi,
                    resource,
                    input.namespace,
                    input.name,
                );
                if (!result.crdAvailable || !result.item) {
                    return { crdAvailable: false, yaml: "" };
                }
                return {
                    crdAvailable: true,
                    yaml: yaml.dump(result.item, {
                        indent: 2,
                        lineWidth: -1,
                        noRefs: true,
                        sortKeys: false,
                    }),
                };
            } catch (error) {
                throw new Error(formatK8sApiError(error));
            }
        }),
        create: procedure
            .input(z.object({ manifest: kthenaManifestSchema }))
            .mutation(async ({ input }) => {
                try {
                    const data = await createKthenaResource(
                        k8sApi,
                        resource,
                        input.manifest,
                    );
                    return { message: `${resource.kind} created successfully`, data };
                } catch (error) {
                    throw new Error(formatK8sApiError(error));
                }
            }),
        update: procedure
            .input(
                z.object({
                    namespace: z.string().min(1),
                    name: z.string().min(1),
                    patchData: kthenaManifestSchema,
                }),
            )
            .mutation(async ({ input }) => {
                try {
                    const data = await replaceKthenaResource(
                        k8sApi,
                        resource,
                        input.namespace,
                        input.name,
                        input.patchData,
                    );
                    return { message: `${resource.kind} updated successfully`, data };
                } catch (error) {
                    throw new Error(formatK8sApiError(error));
                }
            }),
        delete: procedure
            .input(kthenaNameInputSchema)
            .mutation(async ({ input }) => {
                try {
                    const data = await deleteKthenaResource(
                        k8sApi,
                        resource,
                        input.namespace,
                        input.name,
                    );
                    return { message: `${resource.kind} deleted successfully`, data };
                } catch (error) {
                    throw new Error(formatK8sApiError(error));
                }
            }),
    };
}
