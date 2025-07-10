'use client'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@volcano/trpc/react";
import { Loader2Icon, RocketIcon } from "lucide-react";
import QueueResourcesBarChart from "./bar-chart";
import JobStatusPieChart from "./pie-chart";

const DashboardCard = ({ title, value, isLoading }: { title: string; value: string | number; isLoading?: boolean }) => {
  return (
    <Card className="flex flex-row items-center justify-between border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow" >
      <CardHeader>
        <CardTitle className="text-xl font-medium text-gray-500">{title}</CardTitle>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <h3 className={`font-bold text-3xl break-words`}>
            {value}
          </h3>
        )}
      </CardHeader>
    </Card>
  );
};

const DashboardSkeleton = () => {
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
              <p className="text-muted-foreground">Loading chart data...</p>
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
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export const DashboardUtils = () => {
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = trpc.dashboardRouter.getSummary.useQuery();
  const { data: jobStatusMetrics, isLoading: jobStatusLoading, refetch: refetchJobStatus } = trpc.dashboardRouter.getJobStatusMetrics.useQuery();
  const { data: queueMetrics, isLoading: queueMetricsLoading, refetch: refetchQueueMetrics } = trpc.dashboardRouter.getQueueMetrics.useQuery();

  const isLoading = summaryLoading || jobStatusLoading || queueMetricsLoading;

  const categories = {
    "Total Jobs": summary?.totalJobs || 0,
    "Active Jobs": summary?.activeJobs || 0,
    "Running Pods": summary?.runningPods || 0,
    "Complete Rate": summary?.completeRate || "0%",
  };

  // Dynamic alert message based on job status
  const getAlertMessage = () => {
    if (isLoading) {
      return {
        title: "Loading...",
        description: "Fetching dashboard data from the cluster.",
        icon: Loader2Icon,
        variant: "default" as const
      };
    }

    const activeJobs = summary?.activeJobs || 0;
    const totalJobs = summary?.totalJobs || 0;

    if (activeJobs > 0) {
      return {
        title: "Jobs Running",
        description: `${activeJobs} job${activeJobs > 1 ? 's' : ''} ${activeJobs > 1 ? 'are' : 'is'} currently running in the background. You can continue to work while we process your data.`,
        icon: RocketIcon,
        variant: "default" as const
      };
    } else if (totalJobs > 0) {
      return {
        title: "All Jobs Complete",
        description: "All jobs have been completed successfully. No active jobs are currently running.",
        icon: RocketIcon,
        variant: "default" as const
      };
    } else {
      return {
        title: "No Jobs Found",
        description: "No jobs have been created yet. Create your first job to get started.",
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
        {Object?.entries(categories).map(([title, value], index) => (
          <DashboardCard
            key={index}
            title={title}
            value={value}
            isLoading={summaryLoading}
          />
        ))}
      </section>
      <section className="grid gap-2 grid-col-1 md:grid-cols-2 mt-4 w-full">
        <JobStatusPieChart data={jobStatusMetrics} isLoading={jobStatusLoading} />
        <QueueResourcesBarChart data={queueMetrics} isLoading={queueMetricsLoading} />
      </section>
    </div>

  )
}