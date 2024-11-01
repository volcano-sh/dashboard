import express from "express";
import cors from "cors";
import {
  KubeConfig,
  CustomObjectsApi,
  CoreV1Api,
} from "@kubernetes/client-node";
import yaml from "js-yaml";
// import dotenv from 'dotenv';
// dotenv.config();


const app = express();
// app.use(cors());
app.use(cors({ origin: '*' }));

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CustomObjectsApi);

app.get("/api/jobs", async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log('Fetching jobs with params:', { page, limit, searchTerm });

    const response = await k8sApi.listClusterCustomObject(
      "batch.volcano.sh",
      "v1alpha1",
      "jobs",  // 改为正确的资源名称
      {
        pretty: true,
      }
    );

    let filteredJobs = response.body.items || [];
    
    // 应用搜索过滤
    if (searchTerm) {
      filteredJobs = filteredJobs.filter((job) =>
        job.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 计算分页
    const totalCount = filteredJobs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    res.json({
      items: paginatedJobs,
      totalCount: totalCount,
      page: page,
      limit: limit,
    });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ 
      error: "Failed to fetch jobs",
      details: err.message 
    });
  }
});

// 添加获取单个job的接口
app.get("/api/jobs/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await k8sApi.getNamespacedCustomObject(
      "batch.volcano.sh",
      "v1alpha1",
      namespace,
      "jobs",
      name
    );
    res.json(response.body);
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ 
      error: "Failed to fetch job",
      details: err.message 
    });
  }
});

// 在 server.js 中添加获取 YAML 的路由
app.get("/api/jobs/:namespace/:name/yaml", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const response = await k8sApi.getNamespacedCustomObject(
      "batch.volcano.sh",
      "v1alpha1",
      namespace,
      "jobs",
      name
    );

    // 将JSON转换为格式化的YAML
    const formattedYaml = yaml.dump(response.body, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });

    // 设置内容类型为text/yaml并发送响应
    res.setHeader('Content-Type', 'text/yaml');
    res.send(formattedYaml);
  } catch (error) {
    console.error("Error fetching job YAML:", error);
    res.status(500).json({ 
      error: "Failed to fetch job YAML",
      details: error.message 
    });
  }
});


// 获取特定 Queue 的详情
app.get("/api/queues/:name", async (req, res) => {
  try {
    const response = await k8sApi.getClusterCustomObject(
      "scheduling.volcano.sh",
      "v1beta1",
      "queues",
      req.params.name
    );
    res.json(response.body);
  } catch (error) {
    console.error("Error fetching queue details:", error);
    res.status(500).json({ error: "Failed to fetch queue details" });
  }
});

// 获取所有 Volcano Queues
app.get("/api/queues", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // 修改默认值
    const searchTerm = req.query.search || "";

    const response = await k8sApi.listClusterCustomObject(
      "scheduling.volcano.sh",
      "v1beta1",
      "queues"
    );

    let filteredQueues = response.body.items || [];

    if (searchTerm) {
      filteredQueues = filteredQueues.filter((queue) =>
        queue.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const totalCount = filteredQueues.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const paginatedQueues = filteredQueues.slice(startIndex, endIndex);

    res.json({
      items: paginatedQueues,
      totalCount: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("Error fetching queues:", error);
    res.status(500).json({
      error: "Failed to fetch queues",
      details: error.message,
    });
  }
});

app.get("/api/pods", async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const k8sCoreApi = kc.makeApiClient(CoreV1Api);
    const response = await k8sCoreApi.listPodForAllNamespaces();
    
    let filteredPods = response.body.items || [];

    // 应用搜索过滤
    if (searchTerm) {
      filteredPods = filteredPods.filter(pod => 
        pod.metadata.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 计算总数
    const totalCount = filteredPods.length;

    // 应用分页
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const paginatedPods = filteredPods.slice(startIndex, endIndex);

    console.log(`Page: ${page}, Limit: ${limit}, Total: ${totalCount}`);
    console.log(`Showing pods from ${startIndex} to ${endIndex}`);

    res.json({
      items: paginatedPods,
      totalCount: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching pods:', error);
    res.status(500).json({
      error: 'Failed to fetch pods',
      details: error.message
    });
  }
});

// 获取特定 Pod 的详情
app.get("/api/pods/:namespace/:name", async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const k8sCoreApi = kc.makeApiClient(CoreV1Api);

    const response = await k8sCoreApi.readNamespacedPod(name, namespace);
    res.json(response.body);
  } catch (error) {
    console.error("Error fetching pod details:", error);
    res.status(500).json({
      error: "Failed to fetch pod details",
      details: error.message,
    });
  }
});


// 获取所有Jobs（无分页）
app.get("/api/all-jobs", async (req, res) => {
  try {
    const response = await k8sApi.listClusterCustomObject(
      "batch.volcano.sh",
      "v1alpha1",
      "jobs", // 修改这里：从 "jobs" 改为 "vcjobs"
      {
        pretty: true,
      }
    );

    const jobs = response.body.items.map(job => ({
      ...job,
      status: {
        state: job.status?.state || getJobState(job),
        phase: job.status?.phase || job.spec?.minAvailable ? 'Running' : 'Unknown'
      }
    }));

    res.json({
      items: jobs,
      totalCount: jobs.length
    });
  } catch (err) {
    console.error("Error fetching all jobs:", err);
    res.status(500).json({ error: "Failed to fetch all jobs" });
  }
});

// 辅助函数：根据作业状态确定状态
function getJobState(job) {
  if (job.status?.state) return job.status.state;
  if (job.status === 'Running') return 'Running';
  if (job.status === 'Completed') return 'Completed';
  if (job.status === 'Failed') return 'Failed';
  if (job.status === 'Pending') return 'Running';
  return job.status || 'Unknown';
}

// 获取所有Queues（无分页）
app.get("/api/all-queues", async (req, res) => {
  try {
    const response = await k8sApi.listClusterCustomObject(
      "scheduling.volcano.sh",
      "v1beta1",
      "queues"
    );
    res.json({
      items: response.body.items,
      totalCount: response.body.items.length
    });
  } catch (error) {
    console.error("Error fetching all queues:", error);
    res.status(500).json({ error: "Failed to fetch all queues" });
  }
});

// 获取所有Pods（无分页）
app.get("/api/all-pods", async (req, res) => {
  try {
    const k8sCoreApi = kc.makeApiClient(CoreV1Api);
    const response = await k8sCoreApi.listPodForAllNamespaces();
    res.json({
      items: response.body.items,
      totalCount: response.body.items.length
    });
  } catch (error) {
    console.error('Error fetching all pods:', error);
    res.status(500).json({ error: 'Failed to fetch all pods' });
  }
});

const verifyVolcanoSetup = async () => {
  try {
    const k8sCoreApi = kc.makeApiClient(CoreV1Api);
    
    // Verify CRD access
    await k8sApi.listClusterCustomObject(
      "batch.volcano.sh",
      "v1alpha1",
      "jobs"
    );
    return true;
  } catch (error) {
    console.error('Volcano verification failed:', error);
    return false;
  }
};




// Update your server startup
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  const volcanoReady = await verifyVolcanoSetup();
  if (volcanoReady) {
    console.log(`Server running on port ${PORT} with Volcano support`);
  } else {
    console.error('Server started but Volcano support is not available');
  }
});