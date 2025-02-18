import { k8sCoreApi, k8sApi } from '../services/k8sClient.js';

// Get all Pods based on query params
export const getAllPods = async (req, res) => {
  try {
    const namespace = req.query.namespace || "";
    const searchTerm = req.query.search || "";
    const statusFilter = req.query.status || "";

    let response;
    if (namespace === "" || namespace === "All") {
      response = await k8sCoreApi.listPodForAllNamespaces();
    } else {
      response = await k8sCoreApi.listNamespacedPod(namespace);
    }

    let filteredPods = response.body.items || [];

    // Apply search filter
    if (searchTerm) {
      filteredPods = filteredPods.filter((pod) =>
        pod.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter && statusFilter !== "All") {
      filteredPods = filteredPods.filter((pod) =>
        pod.status.phase === statusFilter
      );
    }

    res.json({
      items: filteredPods,
      totalCount: filteredPods.length,
    });
  } catch (err) {
    console.error("Error fetching pods:", err);
    res.status(500).json({
      error: "Failed to fetch pods",
      details: err.message,
    });
  }
};

// Get YAML details of a specific Pod
export const getPodYaml = async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await k8sCoreApi.readNamespacedPod(name, namespace);

    // Convert JSON to formatted YAML
    const formattedYaml = yaml.dump(response.body, {
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

// Get all Kubernetes namespaces
export const getNamespaces = async (req, res) => {
  try {
    const response = await k8sCoreApi.listNamespace();
    res.json({
      items: response.body.items,
    });
  } catch (error) {
    console.error("Error fetching namespaces:", error);
    res.status(500).json({
      error: "Failed to fetch namespaces",
      details: error.message,
    });
  }
};
