// 优先使用环境变量中的端口，如果没有则使用默认端口3000
const getServerPort = () => {
    return process.env.APP_SERVER_PORT || '3001';
  };
  
  // 构建API基础URL
  const API_CONFIG = {
    baseURL: `http://localhost:${getServerPort()}`
  };
  
  // API端点配置
  export const API_ENDPOINTS = {
    jobs: {
      list: `${API_CONFIG.baseURL}/api/jobs`,
      detail: (namespace, name) => `${API_CONFIG.baseURL}/jobs/${namespace}/${name}`
    },
    queues: {
      list: `${API_CONFIG.baseURL}/api/queues`
    },
    pods: {
      list: `${API_CONFIG.baseURL}/api/pods`
    }
  };
  
  export default API_CONFIG;
  