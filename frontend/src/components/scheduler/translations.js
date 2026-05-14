/**
 * Translation keys for the Scheduler section and sidebar navigation.
 * Structured to be compatible with any i18n system the project adopts.
 */
const translations = {
    en: {
        // Sidebar navigation
        nav: {
            dashboard: "Dashboard",
            jobs: "Jobs",
            queues: "Queues",
            pods: "Pods",
            podgroups: "PodGroups",
            scheduler: "Scheduler",
        },
        // Scheduler page
        scheduler: {
            title: "Volcano Scheduler",
            config: "Config",
            configDesc:
                "Scheduler configuration management interface. Enables structured editing of the volcano-scheduler-configmap with validation support.",
            metrics: "Metrics",
            metricsDesc:
                "Metrics visualization for scheduler observability. Displays scheduling latency, preemption counts, and per-plugin performance data.",
            logs: "Logs",
            logsDesc:
                "Centralized scheduler log exploration. Provides real-time streaming and keyword filtering across core Volcano system components.",
            placeholder: "This section is under development.",
            save: "Save",
            saveConfig: "Save Configuration",
        },
    },
    zh: {
        nav: {
            dashboard: "概览",
            jobs: "作业",
            queues: "队列",
            pods: "容器组",
            podgroups: "任务组",
            scheduler: "调度器",
        },
        scheduler: {
            title: "Volcano 调度器",
            config: "配置",
            configDesc:
                "调度器配置管理界面。支持对调度策略进行结构化编辑和验证。",
            metrics: "指标",
            metricsDesc:
                "调度器可观测性指标可视化。展示调度延迟、抢占次数及各插件性能数据。",
            logs: "日志",
            logsDesc:
                "集中式调度器日志查看。提供 Volcano 核心组件的实时日志流和关键字过滤功能。",
            placeholder: "此功能正在开发中。",
            save: "保存",
            saveConfig: "保存配置",
        },
    },
};

export default translations;
