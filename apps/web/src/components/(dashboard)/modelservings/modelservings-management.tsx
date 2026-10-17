"use client"
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
import { useModelServingColumns } from "./columns"
import { CreateModelServingDialog } from "./create-modelserving-dialog"
import { ModelServingEditDialog } from "./modelserving-edit-dialog"

export type ModelServingStatus = {
  name: string
  namespace: string
  replicas: number
  availableReplicas: number
  schedulerName: string
  createdAt: Date
  status: string
  yaml?: string
}

export function modelServingStatusColor(status: string) {
  switch (status) {
    case "Available":
      return "bg-green-100 text-green-800"
    case "Progressing":
      return "bg-blue-100 text-blue-800"
    case "UpdateInProgress":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function summarizeModelServing(item: any): Pick<
  ModelServingStatus,
  "status" | "replicas" | "availableReplicas" | "schedulerName"
> {
  const conditions = item.status?.conditions ?? []
  const isTrue = (type: string) =>
    conditions.some((condition: any) => condition.type === type && condition.status === "True")

  let status = "Unknown"
  if (isTrue("Available")) {
    status = "Available"
  } else if (isTrue("UpdateInProgress")) {
    status = "UpdateInProgress"
  } else if (isTrue("Progressing")) {
    status = "Progressing"
  }

  return {
    status,
    replicas: item.status?.replicas ?? item.spec?.replicas ?? 0,
    availableReplicas: item.status?.availableReplicas ?? 0,
    schedulerName: item.spec?.schedulerName || "volcano",
  }
}

export default function ModelServingsManagement() {
  const t = useTranslations("modelservings")
  const tc = useTranslations("common")
  const format = useFormatter()
  const [items, setItems] = useState<ModelServingStatus[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ModelServingStatus | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<ModelServingStatus | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ModelServingStatus | null>(null)

  const utils = trpc.useUtils()

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  })

  const listQuery = trpc.modelServingsRouter.getModelServings.useQuery(
    {
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error("Error fetching ModelServings:", err)
        setError(t("errors.api", { message: err.message }))
      },
    }
  )

  const crdAvailable = listQuery.data?.crdAvailable !== false

  const availableNamespaces = items
    ? Array.from(new Set(items.map((item) => item.namespace).filter(Boolean))).sort()
    : []

  const availableStatuses = items
    ? Array.from(new Set(items.map((item) => item.status).filter(Boolean))).sort()
    : []

  const { mutateAsync: deleteModelServing, isPending: isDeleting } =
    trpc.modelServingsRouter.deleteModelServing.useMutation({
      onSuccess: async () => {
        setShowDeleteConfirm(false)
        setItemToDelete(null)
        setError(null)
        await utils.modelServingsRouter.getModelServings.invalidate()
      },
      onError: (error) => {
        setError(t("errors.delete", { message: error.message }))
        setShowDeleteConfirm(false)
      },
    })

  const handleEdit = useCallback(async (item: ModelServingStatus) => {
    setError(null)

    try {
      const result = await utils.modelServingsRouter.getModelServingYaml.fetch({
        namespace: item.namespace,
        name: item.name,
      })

      const yaml = result?.yaml || item.yaml || ""
      if (!result?.crdAvailable || !yaml) {
        setError(t("errors.noYaml"))
      }

      setItemToEdit({ ...item, yaml })
      setShowEditModal(true)
    } catch (err) {
      setError(t("errors.fetchYamlEdit"))
      console.error(err)
    }
  }, [utils, t])

  const handleDelete = useCallback((item: ModelServingStatus) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return

    try {
      await deleteModelServing({
        namespace: itemToDelete.namespace,
        name: itemToDelete.name,
      })
    } catch (err) {
      console.error("Failed to delete ModelServing:", err)
    }
  }, [itemToDelete, deleteModelServing])

  const columns = useModelServingColumns({
    availableNamespaces,
    availableStatuses,
    onEdit: crdAvailable ? handleEdit : undefined,
    onDelete: crdAvailable ? handleDelete : undefined,
  })

  useEffect(() => {
    if (listQuery.data) {
      const transformed: ModelServingStatus[] = (listQuery.data.items || []).map((item: any) => {
        const summary = summarizeModelServing(item)
        return {
          name: item.metadata?.name || "",
          namespace: item.metadata?.namespace || "",
          createdAt: new Date(item.metadata?.creationTimestamp || Date.now()),
          yaml: item.yaml || "",
          ...summary,
        }
      })

      setItems(transformed)
    }
  }, [listQuery.data])

  const listTotal = listQuery.data?.total ?? 0
  const listTotalPages = listQuery.data?.totalPages ?? 0
  const listPage = listQuery.data?.page ?? pagination.page

  usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
    setPagination((prev) => ({ ...prev, page }))
  )

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await listQuery.refetch()
      setError(null)
    } catch (err) {
      setError(t("errors.refresh"))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [listQuery, t])

  const handleRowClick = useCallback(async (item: ModelServingStatus) => {
    setError(null)

    try {
      setSelectedItem(item)
      const result = await utils.modelServingsRouter.getModelServingYaml.fetch({
        namespace: item.namespace,
        name: item.name,
      })
      const yaml = result?.yaml || item.yaml || ""
      setSelectedItem({ ...item, yaml })
      setShowDetails(true)
    } catch (err) {
      setError(t("errors.fetchYaml"))
      console.error(err)
    }
  }, [utils, t])

  const handleCreate = () => {
    setShowCreateModal(true)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPagination({
      page: 1,
      pageSize: parseInt(newPageSize),
    })
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }))
  }

  const isLoading = listQuery.isLoading
  const isRefreshing = listQuery.isRefetching

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
            <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? "animate-spin" : ""}`} />
            {tc("actions.refresh")}
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2" disabled={!crdAvailable}>
            <Plus className="h-4 w-4" />
            {t("createModelServing")}
          </Button>
        </div>
      </div>

      {!crdAvailable && (
        <Alert className="mb-4">
          <AlertDescription>{t("crdMissing")}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

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
          <div className=" rounded-lg">
            <DataTable
              columns={columns}
              data={items || []}
              onRowClick={handleRowClick}
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

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t("details.title", { name: selectedItem?.name ?? "" })}
              {selectedItem && (
                <Badge className={modelServingStatusColor(selectedItem.status)}>
                  {selectedItem.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-semibold">{tc("details.name")}</span> {selectedItem.name}
                </div>
                <div>
                  <span className="font-semibold">{tc("details.namespace")}</span> {selectedItem.namespace}
                </div>
                <div>
                  <span className="font-semibold">{t("details.replicas")}</span> {selectedItem.replicas}
                </div>
                <div>
                  <span className="font-semibold">{t("details.available")}</span> {selectedItem.availableReplicas}
                </div>
                <div>
                  <span className="font-semibold">{t("details.scheduler")}</span> {selectedItem.schedulerName}
                </div>
                <div>
                  <span className="font-semibold">{tc("details.created")}</span>{" "}
                  {format.dateTime(selectedItem.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{tc("details.yamlConfiguration")}</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{selectedItem.yaml}</code>
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {itemToEdit && (
        <ModelServingEditDialog
          open={showEditModal}
          setOpen={setShowEditModal}
          handleRefresh={handleRefresh}
          name={itemToEdit.name}
          namespace={itemToEdit.namespace}
          initialYaml={itemToEdit.yaml || ""}
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
            <p>{t("delete.message", { name: itemToDelete?.name ?? "", namespace: itemToDelete?.namespace ?? "" })}</p>
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

      <CreateModelServingDialog open={showCreateModal} setOpen={setShowCreateModal} handleRefresh={handleRefresh} />
    </div>
  )
}
