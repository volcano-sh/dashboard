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
import { useDeepLinkDetail } from "@/hooks/use-deep-link-detail"
import { RelatedLinkGroup } from "@/lib/kthena-links"
import { Plus, RefreshCw } from "lucide-react"
import { KthenaRow, useKthenaColumns } from "./columns"
import { useFormatter, useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "../data-table"
import { ListPagination } from "../list-pagination"
import { KthenaYamlDialog } from "./kthena-yaml-dialog"
import { RelatedLinks } from "./related-links"

export type { KthenaRow } from "./columns"

type ListResult = {
  items?: unknown[]
  total?: number
  totalPages?: number
  page?: number
  crdAvailable?: boolean
}

type YamlResult = { crdAvailable?: boolean; yaml?: string }

type Props = {
  messageNamespace: string
  createKey: string
  kind: string
  apiVersion: string
  defaultYaml: string
  statusColor: (status: string) => string
  mapItem: (item: any) => KthenaRow
  extraColumns?: import("@tanstack/react-table").ColumnDef<KthenaRow>[]
  pagination: { page: number; pageSize: number }
  onPaginationChange: (next: { page: number; pageSize: number }) => void
  listQuery: {
    data?: ListResult
    isLoading: boolean
    isRefetching: boolean
    refetch: () => Promise<unknown>
  }
  fetchYaml: (namespace: string, name: string) => Promise<YamlResult>
  fetchRelated?: (namespace: string, name: string) => Promise<RelatedLinkGroup[]>
  createResource: (manifest: Record<string, unknown>) => Promise<void>
  updateResource: (args: {
    namespace: string
    name: string
    patchData: Record<string, unknown>
  }) => Promise<void>
  deleteResource: (args: { namespace: string; name: string }) => Promise<void>
  extraSummary?: (item: KthenaRow) => React.ReactNode
}

export function KthenaResourcePage({
  messageNamespace,
  createKey,
  kind,
  apiVersion,
  defaultYaml,
  statusColor,
  mapItem,
  extraColumns,
  pagination,
  onPaginationChange,
  listQuery,
  fetchYaml,
  fetchRelated,
  createResource,
  updateResource,
  deleteResource,
  extraSummary,
}: Props) {
  const t = useTranslations(messageNamespace)
  const tc = useTranslations("common")
  const format = useFormatter()
  const [items, setItems] = useState<KthenaRow[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<KthenaRow | null>(null)
  const [relatedGroups, setRelatedGroups] = useState<RelatedLinkGroup[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<KthenaRow | null>(null)
  const [itemToDelete, setItemToDelete] = useState<KthenaRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const crdAvailable = listQuery.data?.crdAvailable !== false

  const availableNamespaces = items
    ? Array.from(new Set(items.map((item) => item.namespace).filter(Boolean))).sort()
    : []
  const availableStatuses = items
    ? Array.from(new Set(items.map((item) => item.status).filter(Boolean))).sort()
    : []

  const openDetails = useCallback(async (namespace: string, name: string, base?: KthenaRow) => {
    setError(null)
    try {
      const result = await fetchYaml(namespace, name)
      const yaml = result?.yaml || base?.yaml || ""
      setSelectedItem({
        ...(base ?? {
          name,
          namespace,
          createdAt: new Date(),
          status: "Unknown",
        }),
        name,
        namespace,
        yaml,
      })
      if (fetchRelated) {
        setRelatedGroups(await fetchRelated(namespace, name))
      } else {
        setRelatedGroups([])
      }
      setShowDetails(true)
    } catch (err) {
      setError(t("errors.fetchYaml"))
      console.error(err)
    }
  }, [fetchYaml, fetchRelated, t])

  useDeepLinkDetail((namespace, name) => {
    void openDetails(namespace, name)
  })

  const handleEdit = useCallback(async (item: KthenaRow) => {
    setError(null)
    try {
      const result = await fetchYaml(item.namespace, item.name)
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
  }, [fetchYaml, t])

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await deleteResource({
        namespace: itemToDelete.namespace,
        name: itemToDelete.name,
      })
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      setError(null)
      await listQuery.refetch()
    } catch (err) {
      setError(t("errors.delete", { message: err instanceof Error ? err.message : "" }))
      setShowDeleteConfirm(false)
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }, [itemToDelete, deleteResource, listQuery, t])

  const columns = useKthenaColumns({
    messageNamespace,
    extraColumns,
    availableNamespaces,
    availableStatuses,
    statusColor,
    onEdit: crdAvailable ? handleEdit : undefined,
    onDelete: crdAvailable
      ? (item) => {
          setItemToDelete(item)
          setShowDeleteConfirm(true)
        }
      : undefined,
  })

  useEffect(() => {
    if (listQuery.data) {
      setItems((listQuery.data.items || []).map(mapItem))
    }
  }, [listQuery.data, mapItem])

  const listTotal = listQuery.data?.total ?? 0
  const listTotalPages = listQuery.data?.totalPages ?? 0
  const listPage = listQuery.data?.page ?? pagination.page

  usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
    onPaginationChange({ ...pagination, page })
  )

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await listQuery.refetch()
    } catch (err) {
      setError(t("errors.refresh"))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [listQuery, t])

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
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2" disabled={!crdAvailable}>
            <Plus className="h-4 w-4" />
            {t(createKey)}
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
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items || []}
            onRowClick={(item) => openDetails(item.namespace, item.name, item)}
            disablePagination={true}
            filterPlaceholder={t("filterPlaceholder")}
          />
          <ListPagination
            page={listPage}
            pageSize={pagination.pageSize}
            total={listTotal}
            totalPages={listTotalPages}
            onPageChange={(page) => onPaginationChange({ ...pagination, page })}
            onPageSizeChange={(size) => onPaginationChange({ page: 1, pageSize: parseInt(size) })}
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
                <Badge className={statusColor(selectedItem.status)}>{selectedItem.status}</Badge>
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
                {extraSummary?.(selectedItem)}
                <div>
                  <span className="font-semibold">{tc("details.created")}</span>{" "}
                  {format.dateTime(selectedItem.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <RelatedLinks groups={relatedGroups} />
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

      <KthenaYamlDialog
        open={showCreateModal}
        setOpen={setShowCreateModal}
        handleRefresh={handleRefresh}
        messageNamespace={messageNamespace}
        kind={kind}
        apiVersion={apiVersion}
        defaultYaml={defaultYaml}
        mode="create"
        onCreate={createResource}
      />

      {itemToEdit && (
        <KthenaYamlDialog
          open={showEditModal}
          setOpen={setShowEditModal}
          handleRefresh={handleRefresh}
          messageNamespace={messageNamespace}
          kind={kind}
          apiVersion={apiVersion}
          defaultYaml={defaultYaml}
          mode="edit"
          name={itemToEdit.name}
          namespace={itemToEdit.namespace}
          initialYaml={itemToEdit.yaml || ""}
          onUpdate={updateResource}
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
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              {tc("actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
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
    </div>
  )
}
