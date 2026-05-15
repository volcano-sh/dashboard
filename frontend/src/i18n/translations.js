export const translations = {
    en: {
        translation: {
            dashboard: {
                title: "Volcano Dashboard",
                refreshData: "Refresh Data",
                stats: {
                    totalJobs: "Total Jobs",
                    activeQueues: "Active Queues",
                    runningPods: "Running Pods",
                    completeRate: "Complete Rate",
                },
                charts: {    
                    jobStatus: {
                        noDataAvailable: "No data available",
                        title: "Jobs Status",
                        status: {
                            completed: "Completed",
                            running: "Running",
                            failed: "Failed",
                        },
                    },
                    queueResources: {
                        title: "Queue Resources",
                        noDataForResource:
                            "No data available for selected resource type",
                        allocatedLabel: "{{resource}} Allocated",
                        capacityLabel: "{{resource}} Capacity",
                        resourceNames: {
                            memory: "Memory",
                            cpu: "CPU",
                            pods: "Pods",
                            gpu: "GPU",
                        },
                        resourceLabels: {
                            memory: "Memory Resources",
                            cpu: "CPU Resources",
                            pods: "Pods Resources",
                            gpu: "GPU Resources",
                        },
                        yAxisLabels: {
                            memory: "Memory (Gi)",
                            cpu: "CPU Cores",
                            pods: "Pod Count",
                            gpu: "GPU Count",
                            default: "Amount",
                        },
                    },
                },
                errors: {
                    jobsApi: "Jobs API error: {{status}}",
                    queuesApi: "Queues API error: {{status}}",
                    podsApi: "Pods API error: {{status}}",
                    fetchDashboardData: "Error fetching dashboard data",
                },
                
            },
        },
    },
    "zh-CN": {
        translation: {
            dashboard: {
                title: "Volcano 仪表盘",
                refreshData: "刷新数据",
                stats: {
                    totalJobs: "作业总数",
                    activeQueues: "活跃队列",
                    runningPods: "运行中的 Pod",
                    completeRate: "完成率",
                },
                charts: {
                    jobStatus: {
                        noDataAvailable: "暂无数据",
                        title: "作业状态",
                        status: {
                            completed: "已完成",
                            running: "运行中",
                            failed: "失败",
                        },
                    },
                    queueResources: {
                        title: "队列资源",
                        noDataForResource: "所选资源类型暂无数据",
                        allocatedLabel: "{{resource}} 已分配",
                        capacityLabel: "{{resource}} 容量",
                        resourceNames: {
                            memory: "内存",
                            cpu: "CPU",
                            pods: "Pod",
                            gpu: "GPU",
                        },
                        resourceLabels: {
                            memory: "内存资源",
                            cpu: "CPU 资源",
                            pods: "Pod 资源",
                            gpu: "GPU 资源",
                        },                   
                        yAxisLabels: {
                            memory: "内存 (Gi)",
                            cpu: "CPU 核数",
                            pods: "Pod 数量",
                            gpu: "GPU 数量",
                            default: "数量",
                        },
                    },
                },
                errors: {
                    jobsApi: "作业 API 错误：{{status}}",
                    queuesApi: "队列 API 错误：{{status}}",
                    podsApi: "Pod API 错误：{{status}}",
                    fetchDashboardData: "获取仪表盘数据时出错",
                },
                
            },
        },
    },
};
