'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaginationClamp } from "@/hooks/use-pagination-clamp"
import { trpc } from "@volcano/trpc/react"
import { Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { ListPagination } from "../list-pagination"
import { useFormatter, useTranslations } from "next-intl"
import { DataTable } from "../data-table"
import { ServerPagination } from "../server-pagination"
import { useJobColumns } from "./columns"
import { CreateJobDialog } from "./create-job-dialog"
import { JobEditDialog } from "./job-edit-dialog"

export type JobStatus = {
  name: string;
  namespace: string;
  queue: string;
  createdAt: Date;
  status: string;
  yaml?: string; // For job details modal
}

export default function JobsManagement() {
  const t = useTranslations("jobs")
  const tc = useTranslations("common")
  const format = useFormatter()
  const [jobs, setJobs] = useState<JobStatus[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobStatus | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [showEditJobModal, setShowEditJobModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [jobToEdit, setJobToEdit] = useState<JobStatus | null>(null)
  const [jobToDelete, setJobToDelete] = useState<JobStatus | null>(null)

  const utils = trpc.useUtils()

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
        setError(t("errors.api", { message: err.message }));
      },
    }
  )

  const jobYamlQuery = trpc.jobsRouter.getJobYaml.useQuery(
    {
      namespace: selectedJob?.namespace || "",
      name: selectedJob?.name || "",
    },
    {
      enabled: false,
      onError: (err) => {
        console.error("Error fetching job YAML:", err);
        setError(t("errors.yamlApi", { message: err.message }));
      },
    },
  );

  const availableNamespaces = jobs ?
    Array.from(new Set(jobs.map(job => job.namespace).filter(Boolean))).sort()
    : [];

  const availableQueues = jobs ?
    Array.from(new Set(jobs.map(job => job.queue).filter(Boolean))).sort()
    : [];

  const availableStatuses = jobs ?
    Array.from(new Set(jobs.map(job => job.status).filter(Boolean))).sort()
    : [];

  const { mutateAsync: deleteJob, isPending: isDeleting } = trpc.jobsRouter.deleteJob.useMutation({
    onSuccess: async () => {
      const deletedJobName = jobToDelete?.name
      setShowDeleteConfirm(false)

      if (jobToDelete) {
        setJobs(prevJobs =>
          prevJobs?.filter(j =>
            !(j.name === jobToDelete.name && j.namespace === jobToDelete.namespace)
          )
        )
      }

      setJobToDelete(null)
      setError(null)

      setTimeout(async () => {
        await handleRefresh()
      }, 2000)

      console.log(`Job "${deletedJobName}" deleted successfully`)
    },
    onError: (error) => {
      setError(t("errors.delete", { message: error.message }))
      setShowDeleteConfirm(false)
    }
  })

  const handleEdit = useCallback(async (job: JobStatus) => {
    setError(null);

    try {
      const yaml = await utils.jobsRouter.getJobYaml.fetch({
        namespace: job.namespace,
        name: job.name
      });

      if (!yaml) {
        setError(t("errors.noYaml"));
      }

      setJobToEdit({ ...job, yaml: yaml || job.yaml || "" });
      setShowEditJobModal(true);
    } catch (err) {
      setError(t("errors.fetchYamlEdit"));
      console.error(err)
    }
  }, [utils])

  const handleDelete = useCallback((job: JobStatus) => {
    setJobToDelete(job)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!jobToDelete) return

    try {
      await deleteJob({
        namespace: jobToDelete.namespace,
        name: jobToDelete.name
      })
    } catch (err) {
      console.error("Failed to delete job:", err)
    }
  }, [jobToDelete, deleteJob])

  const columns = useJobColumns({
    availableNamespaces,
    availableQueues,
    availableStatuses,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

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
    }
  }, [jobsQuery.data]);

  const listTotal = jobsQuery.data?.total ?? 0;
  const listTotalPages = jobsQuery.data?.totalPages ?? 0;
  const listPage = jobsQuery.data?.page ?? pagination.page;

  usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
    setPagination((prev) => ({ ...prev, page }))
  );

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Use tRPC refetch methods
      await Promise.all([
        jobsQuery.refetch(),
      ]);
      setError(null)
    } catch (err) {
      setError(t("errors.refresh"))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [jobsQuery])

  const handleJobClick = useCallback(async (job: JobStatus) => {
    setError(null);

    try {
      const response = await jobYamlQuery.refetch();
      const yaml = response.data || job.yaml || "";
      setSelectedJob({ ...job, yaml });
      setShowJobDetails(true);
    } catch (err) {
      setError(t("errors.fetchYaml"));
      console.error(err)
    }
  }, [jobYamlQuery]);

  const handleJobCreate = () => {
    setShowCreateJobModal(true)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPagination({
      page: 1, // Reset to first page when changing page size
      pageSize: parseInt(newPageSize),
    });
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

  return (
    <div className="container mx-auto p-4 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center">
          <Button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="flex items-center gap-2 me-4"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            {tc("actions.refresh")}
          </Button>
          <Button onClick={handleJobCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("createJob")}
          </Button>
        </div>
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
              filterPlaceholder={t("filterPlaceholder")}
            />
          </div>

          <ListPagination
            page={listPage}
            pageSize={pagination.pageSize}
            total={listTotal}
            totalPages={listTotalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            disabled={isRefreshing}
          />
        </>
      )}

      {/* Job Details Modal */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t("details.title", { name: selectedJob?.name ?? "" })}
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
                  <span className="font-semibold">{tc("details.name")}</span> {selectedJob.name}
                </div>
                <div>
                  <span className="font-semibold">{tc("details.namespace")}</span> {selectedJob.namespace}
                </div>
                <div>
                  <span className="font-semibold">{tc("details.queue")}</span> {selectedJob.queue}
                </div>
                <div>
                  <span className="font-semibold">{tc("details.created")}</span>{" "}
                  {format.dateTime(selectedJob.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{tc("details.yamlConfiguration")}</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{selectedJob.yaml}</code>
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {jobToEdit && (
        <JobEditDialog
          open={showEditJobModal}
          setOpen={setShowEditJobModal}
          handleRefresh={handleRefresh}
          jobName={jobToEdit.name}
          jobNamespace={jobToEdit.namespace}
          initialYaml={jobToEdit.yaml || ""}
        />
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
        if (!isDeleting) setShowDeleteConfirm(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete.title")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{t("delete.message", { name: jobToDelete?.name ?? "", namespace: jobToDelete?.namespace ?? "" })}</p>
            <p className="mt-2 text-sm text-gray-500">{tc("deleteConfirm.cannotUndo")}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              {tc("actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 me-2 animate-spin" />
                  {tc("actions.deleting")}
                </>
              ) : (
                tc("actions.delete")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateJobDialog open={showCreateJobModal} setOpen={setShowCreateJobModal} handleRefresh={handleRefresh} />
    </div>
  )
}
