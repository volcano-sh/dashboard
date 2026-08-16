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
import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { ListPagination } from "../list-pagination"
import { useFormatter, useTranslations } from "next-intl"
import { DataTable } from "../data-table"
import { useModelServingColumns } from "./columns"

export type ModelServingStatus = {
  name: string;
  namespace: string;
  replicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  recoveryPolicy: string;
  createdAt: Date;
  status: string;
  yaml?: string;
}

export default function ModelServingManagement() {
  const t = useTranslations("devices")
  const tc = useTranslations("common")
  const format = useFormatter()
  const [modelServings, setModelServings] = useState<ModelServingStatus[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModelServing, setSelectedModelServing] = useState<ModelServingStatus | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  })

  const query = trpc.modelServingRouter.getModelServings.useQuery(
    {
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error("Error fetching ModelServings:", err);
        setError(t("errors.api", { message: err.message }));
      },
    }
  )

  const yamlQuery = trpc.modelServingRouter.getModelServingYaml.useQuery(
    {
      namespace: selectedModelServing?.namespace || "",
      name: selectedModelServing?.name || "",
    },
    {
      enabled: false,
      onError: (err) => {
        console.error("Error fetching ModelServing YAML:", err);
        setError(t("errors.yamlApi", { message: err.message }));
      },
    }
  );

  const availableNamespaces = modelServings ?
    Array.from(new Set(modelServings.map(ms => ms.namespace).filter(Boolean))).sort()
    : [];

  const availableRecoveryPolicies = modelServings ?
    Array.from(new Set(modelServings.map(ms => ms.recoveryPolicy).filter(Boolean))).sort()
    : [];

  const availableStatuses = modelServings ?
    Array.from(new Set(modelServings.map(ms => ms.status).filter(Boolean))).sort()
    : [];

  const columns = useModelServingColumns({
    availableNamespaces,
    availableRecoveryPolicies,
    availableStatuses,
  });

  useEffect(() => {
    if (query.data) {
      const transformed: ModelServingStatus[] = (query.data.items || []).map((ms: any) => {
        let primaryStatus = 'Unknown';
        if (ms.status?.conditions && Array.isArray(ms.status.conditions)) {
          const trueCondition = ms.status.conditions.find((c: any) => c.status === 'True');
          if (trueCondition?.type) {
            primaryStatus = trueCondition.type;
          }
        } else if (ms.status?.availableReplicas !== undefined && ms.status?.availableReplicas > 0) {
          primaryStatus = 'Available';
        }

        return {
          name: ms.metadata?.name || '',
          namespace: ms.metadata?.namespace || '',
          replicas: ms.status?.replicas ?? ms.spec?.replicas ?? 1,
          availableReplicas: ms.status?.availableReplicas ?? 0,
          updatedReplicas: ms.status?.updatedReplicas ?? 0,
          recoveryPolicy: ms.spec?.recoveryPolicy || 'RoleRecreate',
          createdAt: new Date(ms.metadata?.creationTimestamp || Date.now()),
          status: primaryStatus,
          yaml: ms.yaml || '',
        };
      });

      setModelServings(transformed);
    }
  }, [query.data]);

  const listTotal = query.data?.total ?? 0;
  const listTotalPages = query.data?.totalPages ?? 0;
  const listPage = query.data?.page ?? pagination.page;

  usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
    setPagination((prev) => ({ ...prev, page }))
  );

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await query.refetch()
      setError(null)
    } catch (err) {
      setError(t("errors.refresh"))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [query, t])

  const handleRowClick = useCallback(async (ms: ModelServingStatus) => {
    setError(null);
    try {
      const response = await yamlQuery.refetch();
      const yaml = response.data || ms.yaml || "";
      setSelectedModelServing({ ...ms, yaml });
      setShowDetails(true);
    } catch (err) {
      setError(t("errors.fetchYaml"));
      console.error(err);
    }
  }, [yamlQuery, t]);

  const handlePageSizeChange = (newPageSize: string) => {
    setPagination({
      page: 1,
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
      case "Available":
        return "bg-green-100 text-green-800"
      case "Progressing":
        return "bg-blue-100 text-blue-800"
      case "UpdateInProgress":
        return "bg-yellow-100 text-yellow-800"
      case "Failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isLoading = query.isLoading
  const isRefreshing = query.isRefetching

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
        </div>
      </div>

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
          <div className="rounded-lg">
            <DataTable
              columns={columns}
              data={modelServings || []}
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
              {t("details.title", { name: selectedModelServing?.name ?? "" })}
              {selectedModelServing && (
                <Badge className={getStatusColor(selectedModelServing.status)}>
                  {selectedModelServing.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedModelServing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-semibold">{tc("details.name")}</span> {selectedModelServing.name}
                </div>
                <div>
                  <span className="font-semibold">{tc("details.namespace")}</span> {selectedModelServing.namespace}
                </div>
                <div>
                  <span className="font-semibold">{t("details.availableReplicas")}</span> {selectedModelServing.availableReplicas} / {selectedModelServing.replicas}
                </div>
                <div>
                  <span className="font-semibold">{t("details.recoveryPolicy")}</span> {selectedModelServing.recoveryPolicy}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">{tc("details.created")}</span>{" "}
                  {format.dateTime(selectedModelServing.createdAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{tc("details.yamlConfiguration")}</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{selectedModelServing.yaml}</code>
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
