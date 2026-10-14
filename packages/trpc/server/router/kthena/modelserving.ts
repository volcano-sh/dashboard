import yaml from "js-yaml";
import { procedure, router } from "../../trpc";
import { k8sApi } from "../../utils/k8s";
import { fetchModelServings } from "../helpers";
import {
  getModelServingInputSchema,
  getModelServingsInputSchema,
} from "./schema";

export const modelServingRouter = router({
  getModelServings: procedure
    .input(getModelServingsInputSchema)
    .query(async ({ input }) => {
      const { page = 1, pageSize = 10 } = input;
      return fetchModelServings(page, pageSize);
    }),

  getModelServing: procedure
    .input(getModelServingInputSchema)
    .query(async ({ input }) => {
      const { namespace, name } = input;
      const response = await k8sApi.getNamespacedCustomObject({
        group: "workload.kthena.io",
        version: "v1alpha1",
        namespace,
        plural: "modelservings",
        name,
      });
      return response;
    }),

  getModelServingYaml: procedure
    .input(getModelServingInputSchema)
    .query(async ({ input }) => {
      const { namespace, name } = input;
      const response = await k8sApi.getNamespacedCustomObject({
        group: "workload.kthena.io",
        version: "v1alpha1",
        namespace,
        plural: "modelservings",
        name,
      });

      const formattedYaml = yaml.dump(response, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });

      return formattedYaml;
    }),
});
