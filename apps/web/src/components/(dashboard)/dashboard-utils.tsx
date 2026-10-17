'use client'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeverityBadgeClass, getSeverityLabel } from "@/lib/resource-health";
import { trpc } from "@volcano/trpc/react";
import { Loader2Icon, RocketIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import QueueResourcesBarChart from "./bar-chart";
import JobStatusPieChart from "./pie-chart";

const DashboardCard = ({ title, value, isLoading, accent }: { title: string; value: string | number; isLoading?: boolean; accent?: string }) => {
  return (
    <Card className="flex flex-row items-center justify-between border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow" >
      <CardHeader>
        <CardTitle className="text-xl font-medium text-gray-500">{title}</CardTitle>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <h3 className={`font-bold text-3xl break-words ${accent ?? ""}`}>
            {value}
          </h3>
        )}
      </CardHeader>
    </Card>
  );
};

const SeverityCard = ({ title, summary, isLoading }: { title: string; summary?: { warningCount?: number; failureCount?: number; severity?: string; score?: number; label?: string }; isLoading?: boolean }) => {
  const t = useTranslations("dashboard");
  const severity = summary?.severity ?? "healthy";
  const label = summary?.label ?? getSeverityLabel(severity);

  return (
    <Card className="flex flex-col justify-between border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {!isLoading && (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getSeverityBadgeClass(severity)}`}>
            {label}
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-24 mt-4" />
      ) : (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("cards.warning")}</span>
            <span className="font-semibold">{summary?.warningCount ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("cards.failure")}</span>
            <span className="font-semibold text-red-600">{summary?.failureCount ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("cards.healthScore")}</span>
            <span className="font-semibold">{summary?.score ?? 100}%</span>
          </div>
        </div>
      )}
    </Card>
  );
};

const DashboardSkeleton = () => {
  const t = useTranslations("common");
  const td = useTranslations("dashboard");

  return (
    <div className="mt-4 mx-4">
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="flex flex-row items-center justify-between border rounded-lg p-2">
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="grid gap-2 grid-col-1 md:grid-cols-2 mt-4 w-full">
        <Card className="w-full p-4 h-full">
          <CardHeader className="items-center pb-0">
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="flex flex-col items-center space-y-2">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">{t("loadingChartData")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-[180px]" />
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="flex flex-col items-center space-y-2">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">{td("pieChart.loading")}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export const DashboardUtils = () => {
  const t = useTranslations("dashboard");
  const { data: summary, isLoading: summaryLoading } = trpc.dashboardRouter.getSummary.useQuery();
  const { data: jobStatusMetrics, isLoading: jobStatusLoading } = trpc.dashboardRouter.getJobStatusMetrics.useQuery();
  const { data: queueMetrics, isLoading: queueMetricsLoading } = trpc.dashboardRouter.getQueueMetrics.useQuery();

  const isLoading = summaryLoading || jobStatusLoading || queueMetricsLoading;

  const categories = [
    { title: t("cards.totalJobs"), value: summary?.totalJobs || 0 },
    { title: t("cards.activeJobs"), value: summary?.activeJobs || 0 },
    { title: t("cards.runningPods"), value: summary?.runningPods || 0 },
    { title: t("cards.completeRate"), value: summary?.completeRate || "0%" },
  ];

  const jobHealthSummary = summary?.jobHealth ?? { warningCount: 0, failureCount: 0, severity: "healthy", score: 100, label: "Healthy" };
  const podHealthSummary = summary?.podHealth ?? { warningCount: 0, failureCount: 0, severity: "healthy", score: 100, label: "Healthy" };

  const getAlertMessage = () => {
    if (isLoading) {
      return {
        title: t("alerts.loadingTitle"),
        description: t("alerts.loadingDescription"),
        icon: Loader2Icon,
        variant: "default" as const
      };
    }

    const activeJobs = summary?.activeJobs || 0;
    const totalJobs = summary?.totalJobs || 0;

    if (activeJobs > 0) {
      return {
        title: t("alerts.jobsRunningTitle"),
        description: t("alerts.jobsRunningDescription", { count: activeJobs }),
        icon: RocketIcon,
        variant: "default" as const
      };
    } else if (totalJobs > 0) {
      return {
        title: t("alerts.allCompleteTitle"),
        description: t("alerts.allCompleteDescription"),
        icon: RocketIcon,
        variant: "default" as const
      };
    } else {
      return {
        title: t("alerts.noJobsTitle"),
        description: t("alerts.noJobsDescription"),
        icon: RocketIcon,
        variant: "default" as const
      };
    }
  };

  const alertInfo = getAlertMessage();
  const AlertIcon = alertInfo.icon;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mt-4 mx-4">
      <div className="flex items-center justify-between mb-4">
        <Alert className="max-w-md">
          <AlertIcon className="h-4 w-4" />
          <AlertTitle>{alertInfo.title}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {alertInfo.description}
          </AlertDescription>
        </Alert>
      </div>
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4">
        {categories.map(({ title, value }, index) => (
          <DashboardCard
            key={index}
            title={title}
            value={value}
            isLoading={summaryLoading}
          />
        ))}
      </section>
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 mt-4">
        <SeverityCard title={t("cards.jobHealth")} summary={jobHealthSummary} isLoading={summaryLoading} />
        <SeverityCard title={t("cards.podHealth")} summary={podHealthSummary} isLoading={summaryLoading} />
      </section>
      <section className="grid gap-2 grid-cols-1 md:grid-cols-2 items-start mt-4 w-full">
        <JobStatusPieChart data={jobStatusMetrics} isLoading={jobStatusLoading} />
        <QueueResourcesBarChart data={queueMetrics} isLoading={queueMetricsLoading} />
      </section>
    </div>
  )
}
