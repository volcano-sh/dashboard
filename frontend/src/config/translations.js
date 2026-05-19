/**
 * Centralized translation system for Volcano Dashboard
 * Supports English (en) and Simplified Chinese (zh)
 * Uses standard Kubernetes/CNCF terminology
 */

export const translations = {
  en: {
    // Page Headings
    volcanoJobsStatus: "VOLCANO JOBS STATUS",
    volcanoQueuesStatus: "VOLCANO QUEUES STATUS",
    volcanoPodsStatus: "VOLCANO PODS STATUS",
    volcanoPodGroups: "VOLCANO PODGROUPS",

    // Navigation Menu
    dashboard: "Dashboard",
    jobs: "Jobs",
    queues: "Queues",
    pods: "Pods",
    podGroups: "PodGroups",

    // Dashboard Header
    volcanoDashboard: "Volcano Dashboard",
    refreshData: "Refresh Data",

    // Stat Cards
    totalJobs: "Total Jobs",
    activeQueues: "Active Queues",
    runningPods: "Running Pods",
    completeRate: "Complete Rate",

    // Charts
    jobsStatus: "Jobs Status",
    completed: "Completed",
    running: "Running",
    failed: "Failed",
    queueResources: "Queue Resources",

    // Job Table
    searchJobs: "Search jobs...",
    refreshJobs: "Refresh Jobs",
    createJob: "Create Job",
    noData: "No data available",

    // Queue Table
    searchQueues: "Search queues...",
    refreshQueues: "Refresh Queues",
    createQueue: "Create Queue",

    // Pod Table
    searchPods: "Search pods...",
    refreshPods: "Refresh Pods",

    // PodGroups Table
    searchPodGroups: "Search PodGroups...",

    // Table Headers & Content
    name: "Name",
    namespace: "Namespace",
    queue: "Queue",
    status: "Status",
    creationTime: "Creation Time",
    actions: "Actions",
    age: "Age",
    minMember: "Min Member",
    noJobsFound: "No jobs found.",
    noQueuesFound: "No queues found.",
    noPodGroupsFound: "No PodGroups found.",
    filter: "Filter",
    all: "All",
    default: "Default",
    pending: "Pending",
    succeeded: "Succeeded",

    // Pagination
    perPage: "per page",
    totalCountJobs: "Total Jobs",
    totalCountQueues: "Total Queues",
    totalCountPods: "Total Pods",
    totalPods: "Total Pods",
    totalCountPodGroups: "Total PodGroups",

    // Common Actions
    search: "Search",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",

    // Dialog Labels
    jobName: "Job Name",
    queueName: "Queue Name",
    podName: "Pod Name",
    refresh: "Refresh",
    refreshListings: "Refresh Listings",
    createPod: "Create Pod",
    createPodGroup: "Create PodGroup",
    sort: "Sort",
    filter: "Filter:",
    filterAll: "Filter: All",
    filterDefault: "Filter: Default",
    unknown: "Unknown",
    open: "Open",
    closed: "Closed",

    // Messages & Errors
    fetchError: "Failed to fetch {resource}: Request failed with status code {code}",
    errorFetch: "Failed to fetch",
    errorFetchPods: "Failed to fetch Pods",
    apiError: "{resource} API error: {code}",

    // Create job Dialogs
    createJobTitle: "Create a Job",
    yamlInstruction: "Paste or type your Job YAML specification below:",

    // Create Queue Dialogs
    createQueueTitle: "Create a Queue",
    weight: "Weight",
    reclaimable: "Reclaimable",
    guaranteeResources: "Guarantee Resources (Optional)",
    capabilityResources: "Capability Resources (Optional)",
    deservedResources: "Deserved Resources (Optional)",
    cpu: "CPU",
    memory: "Memory",
    customScalarResources: "Custom Scalar Resources",
    key: "Key",
    value: "Value",

    // Create Pod Dialogs
    createPodTitle: "Create Pod",
    namespace: "Namespace",
    containerName: "Container Name",
    containerImage: "Container Image",
    containerPort: "Container Port",

    // Create PodGroup Dialogs
    createPodGroupTitle: "Create a PodGroup",
    podGroupName: "PodGroup Name",

    // Utility & Examples
    example: "e.g.",
    
    // PREPARING FOR THE /SCHEDULER SECTION
    schedulerTitle: "Scheduler Management",
    configTab: "Configuration",
    metricsTab: "Metrics",
    logsTab: "Logs",

    // GENERAL UI POLISH 
    noData: "No data found",
    loading: "Loading...",
    errorFetch: "Failed to fetch data",
    noPods: "No pods found.",
    confirmDelete: "Confirm delete?",
  },
  zh: {
    // Page Headings - 页面标题
    volcanoJobsStatus: "Volcano 任务状态",
    volcanoQueuesStatus: "Volcano 队列状态",
    volcanoPodsStatus: "Volcano Pods 状态",
    volcanoPodGroups: "Volcano Pod组",

    // Navigation Menu - 导航菜单
    dashboard: "仪表板",
    jobs: "任务",
    queues: "队列",
    pods: "Pods",
    podGroups: "Pod组",

    // Dashboard Header - 仪表板标题
    volcanoDashboard: "Volcano 仪表板",
    refreshData: "刷新数据",

    // Stat Cards - 统计卡片
    totalJobs: "总任务数",
    activeQueues: "活跃队列",
    runningPods: "运行中的Pods",
    completeRate: "完成率",

    // Charts - 图表
    jobsStatus: "任务状态",
    completed: "已完成",
    running: "运行中",
    failed: "失败",
    queueResources: "队列资源",

    // Job Table - 任务表格
    searchJobs: "搜索任务...",
    refreshJobs: "刷新任务",
    createJob: "创建任务",
    noData: "无可用数据",

    // Queue Table - 队列表格
    searchQueues: "搜索队列...",
    refreshQueues: "刷新队列",
    createQueue: "创建队列",

    // Pod Table - Pod表格
    searchPods: "搜索Pods...",
    refreshPods: "刷新Pods",

    // PodGroups Table - Pod组表格
    searchPodGroups: "搜索 Pod组...",

    // Table Headers & Content - 表格标题和内容
    name: "名称",
    namespace: "命名空间",
    queue: "队列",           
    status: "状态",
    creationTime: "创建时间",
    actions: "操作",
    age: "存活时间",
    minMember: "最小成员数",
    noJobsFound: "未找到任务。",
    noQueuesFound: "未找到队列。",
    noPods: "未找到 Pods。",
    noPodGroupsFound: "未找到 Pod组。",
    filter: "筛选",
    all: "全部",
    default: "默认",
    pending: "等待中",
    succeeded: "已完成",

    // Pagination - 分页
    perPage: "条/页",
    totalCountJobs: "任务总数",
    totalCountQueues: "队列总数",
    totalCountPods: "Pods 总数",
    totalPods: "Pods 总数",
    totalCountPodGroups: "Pod组总数",

    // Common Actions - 常用操作
    search: "搜索",
    create: "创建",
    edit: "编辑",
    delete: "删除",
    cancel: "取消",
    save: "保存",

    // Dialog Labels - 对话框标签
    jobName: "任务名称",
    queueName: "队列名称",
    podName: "Pod 名称",
    refresh: "刷新",
    refreshListings: "刷新列表",
    createPod: "创建 Pod",
    createPodGroup: "创建 Pod组",
    sort: "排序",
    filter: "筛选:",
    filterAll: "筛选: 全部",
    filterDefault: "筛选: 默认",
    unknown: "未知",
    open: "开放",
    closed: "已关闭",

    // Messages & Errors - 消息和错误
    fetchError: "获取 {resource} 失败：请求失败，状态码 {code}",
    errorFetch: "获取失败",
    errorFetchPods: "获取 Pods 失败",
    apiError: "{resource} API 错误: {code}",

    // Create job Dialogs - 创建任务对话框
    createJobTitle: "创建任务",
    yamlInstruction: "在下方粘贴或输入任务 YAML 规范：",

    // Create Queue Dialogs - 创建队列对话框
    createQueueTitle: "创建队列",
    weight: "权重",
    reclaimable: "可回收",
    guaranteeResources: "保证资源 (可选)",
    capabilityResources: "能力资源 (可选)",
    deservedResources: "应得资源 (可选)",
    cpu: "CPU",
    memory: "内存",
    customScalarResources: "自定义标量资源",
    key: "键",
    value: "值",

    // Create Pod Dialogs - 创建 Pod 对话框
    createPodTitle: "创建 Pod",
    namespace: "命名空间",
    containerName: "容器名称",
    containerImage: "容器镜像",
    containerPort: "容器端口",

    // Create PodGroup Dialogs - 创建 Pod组 对话框
    createPodGroupTitle: "创建 Pod组",
    podGroupName: "Pod组名称",

    // Utility & Examples - 实用程序和示例
    example: "例如",

    // PREPARING FOR THE /SCHEDULER SECTION - 准备 /SCHEDULER 部分
    schedulerTitle: "调度器管理",
    configTab: "配置",
    metricsTab: "指标",
    logsTab: "日志",

    // GENERAL UI POLISH - 通用 UI 精炼
    noData: "未找到数据",
    loading: "加载中...",
    errorFetch: "获取数据失败",
    confirmDelete: "确认删除吗？",
  },
};

/**
 * Get a specific translation key for a language
 * @param {string} language - Language code ('en' or 'zh')
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
export const getTranslation = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
};

/**
 * Default language set to Chinese for the Volcano Dashboard
 */
export const DEFAULT_LANGUAGE = "zh";
