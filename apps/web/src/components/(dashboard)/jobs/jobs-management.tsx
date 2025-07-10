'use client'

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@volcano/trpc/react"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "../data-table"
import { columns } from "./columns"

export type JobStatus = {
  name: string;
  namespace: string;
  queue: string;
  createdAt: Date;
  status: string;
  yaml?: string; // For job details modal
}

export default function JobsManagement() {
  const [jobs, setJobs] = useState<JobStatus[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobStatus | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [totalJobs, setTotalJobs] = useState(0)

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  })

  const jobsQuery = trpc.jobsRouter.getJobs.useQuery(
    {
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error("Error fetching jobs:", err);
        setError(`Jobs API error: ${err.message}`);
      },
    }
  )

  const queuesQuery = trpc.queueRouter.getAllQueues.useQuery(
    undefined,
    {
      onError: (err) => {
        console.error("Error fetching queues:", err);
        setError(`Queues API error: ${err.message}`);
      },
    },
  );

  const jobYamlQuery = trpc.jobsRouter.getJobYaml.useQuery(
    {
      namespace: selectedJob?.namespace || "",
      name: selectedJob?.name || "",
    },
    {
      enabled: false,
      onError: (err) => {
        console.error("Error fetching job YAML:", err);
        setError(`Job YAML API error: ${err.message}`);
      },
    },
  );

  // Use tRPC query results to update state
  useEffect(() => {
    if (jobsQuery.data) {
      // Transform the API response to match our JobStatus type
      const transformedJobs: JobStatus[] = (jobsQuery.data.items || []).map((job: any) => ({
        name: job.metadata?.name || '',
        namespace: job.metadata?.namespace || '',
        queue: job.spec?.queue || '',
        createdAt: new Date(job.metadata?.creationTimestamp || Date.now()),
        status: job.status?.state?.phase || 'unknown',
        yaml: job.yaml || '',
      }));

      setJobs(transformedJobs);
      setTotalJobs(jobsQuery.data.totalCount || 0);
    }
  }, [jobsQuery.data]);

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Use tRPC refetch methods
      await Promise.all([
        jobsQuery.refetch(),
        queuesQuery.refetch()
      ]);
      setError(null)
    } catch (err) {
      setError("Failed to refresh jobs")
    } finally {
      setLoading(false)
    }
  }, [jobsQuery, queuesQuery])

  const handleJobClick = useCallback(async (job: JobStatus) => {
    setError(null);

    try {
      const response = await jobYamlQuery.refetch();
      const yaml = response.data || job.yaml || "";
      setSelectedJob({ ...job, yaml });
      setShowJobDetails(true);
    } catch (err) {
      setError("Failed to fetch job YAML");
    }
  }, [jobYamlQuery]);

  const handlePageSizeChange = (newPageSize: string) => {
    setPagination(prev => ({
      page: 1, // Reset to first page when changing page size
      pageSize: parseInt(newPageSize),
    }));
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "failed":
      case "Terminated":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Check if any query is loading
  const isLoading = jobsQuery.isLoading
  const isRefreshing = jobsQuery.isRefetching

  // Calculate pagination info
  const totalPages = Math.ceil(totalJobs / pagination.pageSize);
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, totalJobs);

  return (
    <div className="container mx-auto p-4 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs Status</h1>
        <Button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          {/* Enhanced DataTable with click handlers */}
          <div className=" rounded-lg">
            <DataTable
              columns={columns}
              data={jobs || []}
              onRowClick={handleJobClick}
              disablePagination={true}
            />
          </div>

          {/* Server-side Pagination Controls */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {totalJobs} results
            </div>
            <div className="flex items-center space-x-2">
              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Job Details Modal */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Job Details: {selectedJob?.name}
              {selectedJob && (
                <Badge className={getStatusColor(selectedJob.status)}>
                  {selectedJob.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-semibold">Name:</span> {selectedJob.name}
                </div>
                <div>
                  <span className="font-semibold">Namespace:</span> {selectedJob.namespace}
                </div>
                <div>
                  <span className="font-semibold">Queue:</span> {selectedJob.queue}
                </div>
                <div>
                  <span className="font-semibold">Created:</span> {selectedJob.createdAt.toLocaleString()}
                </div>
              </div>

              {/* YAML Configuration */}
              <div>
                <h3 className="font-semibold mb-2">YAML Configuration</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{selectedJob.yaml}</code>
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
