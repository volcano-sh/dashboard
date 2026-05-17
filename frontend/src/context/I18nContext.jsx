import React, { createContext, useContext, useState, useEffect } from "react";

// Translation dictionary for English and Simplified Chinese.
const translations = {
    en: {
        common: {
            dashboard: "Dashboard",
            jobs: "Jobs",
            queues: "Queues",
            queue: "Queue",
            pods: "Pods",
            podgroups: "PodGroups",
            refresh: "Refresh Data",
            actions: "Actions",
            status: "Status",
            name: "Name",
            namespace: "Namespace",
            creationTime: "Creation Time",
            search: "Search...",
            all: "All",
            cancel: "Cancel",
            submit: "Submit",
            delete: "Delete",
            noData: "No data found",
            close: "Close",
            confirm: "Confirm",
            activeQueues: "Active Queues",
            runningPods: "Running Pods",
            completeRate: "Complete Rate",
            sort: "Sort",
        },
        sidebar: {
            dashboard: "Dashboard",
            jobs: "Jobs",
            queues: "Queues",
            pods: "Pods",
            podgroups: "PodGroups",
        },
        dashboard: {
            title: "Volcano Dashboard",
            totalJobs: "Total Jobs",
            totalQueues: "Total Queues",
            totalPods: "Total Pods",
            pendingJobs: "Pending Jobs",
            runningJobs: "Running Jobs",
            completedJobs: "Completed Jobs",
            failedJobs: "Failed Jobs",
            jobDistribution: "Job Distribution by Queue",
            resourceAllocation: "Queue Resource Allocation",
            weightAllocation: "Queue Weight Allocation",
            statusDistribution: "Job Status Distribution",
            refreshSuccess: "Data refreshed successfully",
            activeQueues: "Active Queues",
            runningPods: "Running Pods",
            completeRate: "Complete Rate",
        },
        jobs: {
            title: "Volcano Jobs Status",
            searchPlaceholder: "Search jobs...",
            refreshLabel: "Refresh Job Listings",
            createLabel: "Create Job",
            dialogTitle: "Create a Job",
            dialogResourceNameLabel: "Job Name",
            dialogResourceType: "Job",
            noJobs: "No jobs found.",
            rowsPerPage: "Rows per page",
            yamlDetails: "YAML Details",
        },
        queues: {
            title: "Volcano Queues Status",
            searchPlaceholder: "Search queues...",
            refreshLabel: "Refresh Queue Listings",
            createLabel: "Create Queue",
            dialogTitle: "Create a Queue",
            dialogResourceNameLabel: "Queue Name",
            dialogResourceType: "Queue",
            noQueues: "No queues found.",
            weight: "Weight",
            reclaimable: "Reclaimable",
        },
        pods: {
            title: "Volcano Pods Status",
            searchPlaceholder: "Search pods...",
            refreshLabel: "Refresh Pod Listings",
            createLabel: "Create Pod",
            dialogTitle: "Create a Pod",
            dialogResourceNameLabel: "Pod Name",
            dialogResourceType: "Pod",
            noPods: "No pods found.",
            node: "Node",
            ip: "IP",
        },
        podgroups: {
            title: "Volcano PodGroups Status",
            searchPlaceholder: "Search podgroups...",
            refreshLabel: "Refresh PodGroup Listings",
            noPodGroups: "No podgroups found.",
            minAvailable: "Min Available",
        },
    },
    zh: {
        common: {
            dashboard: "仪表盘",
            jobs: "任务",
            queues: "队列",
            queue: "队列",
            pods: "容器组 (Pods)",
            podgroups: "容器组组 (PodGroups)",
            refresh: "刷新数据",
            actions: "操作",
            status: "状态",
            name: "名称",
            namespace: "命名空间",
            creationTime: "创建时间",
            search: "搜索...",
            all: "全部",
            cancel: "取消",
            submit: "提交",
            delete: "删除",
            noData: "暂无数据",
            close: "关闭",
            confirm: "确认",
            activeQueues: "活动队列",
            runningPods: "运行中 Pods",
            completeRate: "完成率",
            sort: "排序",
        },
        sidebar: {
            dashboard: "控制台",
            jobs: "任务管理",
            queues: "队列管理",
            pods: "Pods 容器组",
            podgroups: "PodGroups 容器组组",
        },
        dashboard: {
            title: "Volcano 仪表盘",
            totalJobs: "任务总数",
            totalQueues: "队列总数",
            totalPods: "Pods 总数",
            pendingJobs: "待处理任务",
            runningJobs: "运行中任务",
            completedJobs: "已完成任务",
            failedJobs: "失败任务",
            jobDistribution: "队列任务分布",
            resourceAllocation: "队列资源分配",
            weightAllocation: "队列权重分配",
            statusDistribution: "任务状态分布",
            refreshSuccess: "数据刷新成功",
            activeQueues: "活动队列",
            runningPods: "运行中 Pods",
            completeRate: "完成率",
        },
        jobs: {
            title: "Volcano 任务状态",
            searchPlaceholder: "搜索任务...",
            refreshLabel: "刷新任务列表",
            createLabel: "创建任务",
            dialogTitle: "新建任务",
            dialogResourceNameLabel: "任务名称",
            dialogResourceType: "任务",
            noJobs: "未找到任务。",
            rowsPerPage: "每页行数",
            yamlDetails: "YAML 详情",
        },
        queues: {
            title: "Volcano 队列状态",
            searchPlaceholder: "搜索队列...",
            refreshLabel: "刷新队列列表",
            createLabel: "创建队列",
            dialogTitle: "新建队列",
            dialogResourceNameLabel: "队列名称",
            dialogResourceType: "队列",
            noQueues: "未找到队列。",
            weight: "权重",
            reclaimable: "可回收",
        },
        pods: {
            title: "Volcano Pods 状态",
            searchPlaceholder: "搜索 Pods...",
            refreshLabel: "刷新 Pod 列表",
            createLabel: "创建 Pod",
            dialogTitle: "新建 Pod",
            dialogResourceNameLabel: "Pod 名称",
            dialogResourceType: "Pod",
            noPods: "未找到 Pods。",
            node: "所在节点",
            ip: "IP 地址",
        },
        podgroups: {
            title: "Volcano PodGroups 状态",
            searchPlaceholder: "搜索 PodGroups...",
            refreshLabel: "刷新 PodGroup 列表",
            noPodGroups: "未找到 PodGroups。",
            minAvailable: "最小可用数",
        },
    },
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
    // Read initial locale from localStorage or default to English.
    const [locale, setLocaleState] = useState(() => {
        const saved = localStorage.getItem("volcano_locale");
        return saved === "zh" || saved === "en" ? saved : "en";
    });

    const setLocale = (newLocale) => {
        if (newLocale === "en" || newLocale === "zh") {
            setLocaleState(newLocale);
            localStorage.setItem("volcano_locale", newLocale);
        }
    };

    const toggleLocale = () => {
        setLocale(locale === "en" ? "zh" : "en");
    };

    /**
     * Translate function supporting nested path keys (e.g. 'dashboard.title')
     */
    const t = (path, defaultValue = "") => {
        if (!path) return "";

        const keys = path.split(".");
        let result = translations[locale];

        for (const key of keys) {
            if (result && typeof result === "object" && key in result) {
                result = result[key];
            } else {
                // Key not found, fall back to English dictionary.
                let fallback = translations["en"];
                for (const fallbackKey of keys) {
                    if (
                        fallback &&
                        typeof fallback === "object" &&
                        fallbackKey in fallback
                    ) {
                        fallback = fallback[fallbackKey];
                    } else {
                        fallback = null;
                        break;
                    }
                }
                return fallback !== null ? fallback : defaultValue || path;
            }
        }

        return typeof result === "string" ? result : defaultValue || path;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
};
