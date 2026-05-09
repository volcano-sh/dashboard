import k8sService from "../services/k8sService.js";
import yaml from "js-yaml";

export const getPods = async (req, res) => {
    try {
        const namespace = req.query.namespace || "";
        const searchTerm = req.query.search || "";
        const statusFilter = req.query.status || "";

        const result = await k8sService.listPods(
            req.clusterContext,
            namespace,
            searchTerm,
            statusFilter,
        );
        res.json(result);
    } catch (err) {
        console.error("Error fetching pods:", err);
        res.status(500).json({
            error: "Failed to fetch pods",
            details: err.message,
        });
    }
};

export const getPodYaml = async (req, res) => {
    try {
        const { namespace, name } = req.params;
        const result = await k8sService.readPod(req.clusterContext, namespace, name);

        const formattedYaml = yaml.dump(result, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
        });

        res.setHeader("Content-Type", "text/yaml");
        res.send(formattedYaml);
    } catch (error) {
        console.error("Error fetching pod YAML:", error);
        res.status(500).json({
            error: "Failed to fetch pod YAML",
            details: error.message,
        });
    }
};

export const createPod = async (req, res) => {
    let podManifest = req.body;
    try {
        if (
            !podManifest ||
            !podManifest.metadata ||
            !podManifest.metadata.name ||
            !podManifest.spec
        ) {
            return res.status(400).json({ error: "Invalid pod manifest" });
        }

        if (podManifest.apiVersion === "scheduling.volcano.sh/v1beta1") {
            podManifest.apiVersion = "v1";
        }
        if (podManifest.kind !== "Pod") {
            podManifest.kind = "Pod";
        }

        let namespace = podManifest.metadata.namespace;
        if (!namespace || namespace === "All" || !namespace.trim()) {
            namespace = "default";
            podManifest.metadata.namespace = namespace;
        }

        const result = await k8sService.createPod(req.clusterContext, namespace, podManifest);
        res.status(201).json({
            message: "Pod created successfully",
            data: result.body,
        });
    } catch (error) {
        console.error("Error creating pod:", error?.body || error);
        let msg = "Failed to create pod";
        if (error?.body?.message) msg = error.body.message;
        res.status(500).json({ error: msg });
    }
};
