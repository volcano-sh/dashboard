export const queueTranslations = {
    zhCN: {
        title: "Volcano 队列状态",

        searchPlaceholder: "搜索队列...",
        refreshQueues: "刷新队列",
        createQueue: "创建队列",
        createQueueDialog: "创建队列",

        queueName: "队列名称",
        queue: "队列",
        noQueuesFound: "未找到队列",

        totalQueues: "队列总数",

        perPage: (count) => `每页 ${count} 条`,

        allocatedField: (field) => `已分配 ${field}`,

        creationTime: "创建时间",
        sort: "排序",

        state: "状态",
        filter: "筛选",
        all: "全部",

        actions: "操作",

        queueYamlTitle: "队列 YAML",
        close: "关闭",

        unknown: "未知",

        fetchQueuesError: "获取队列失败",
        fetchQueueYamlError: "获取队列 YAML 失败",
        networkError: "网络错误",
        queueCreatedSuccess: "队列创建成功！",
    },
};
