"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KthenaResourcePage } from "@/components/(dashboard)/kthena/kthena-resource-page"
import { relatedRefsToItems } from "@/lib/kthena-links"
import { trpc } from "@volcano/trpc/react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useState } from "react"

const defaultYaml = `apiVersion: networking.serving.volcano.sh/v1alpha1
kind: ModelServer
metadata:
  name: demo-server
  namespace: default
spec:
  model: demo
  inferenceEngine: vLLM
  workloadSelector:
    matchLabels:
      app: demo-server
  workloadPort:
    port: 8000
    protocol: http
`

export default function ModelServersManagement() {
  const t = useTranslations("modelservers")
  const tr = useTranslations("common.related")
  const locale = useLocale()
  const utils = trpc.useUtils()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const listQuery = trpc.modelServersRouter.list.useQuery(pagination, {
    keepPreviousData: true,
    onError: (err) => console.error(err),
  })
  const createMutation = trpc.modelServersRouter.create.useMutation()
  const updateMutation = trpc.modelServersRouter.update.useMutation()
  const deleteMutation = trpc.modelServersRouter.delete.useMutation()

  const mapItem = useCallback((item: any) => ({
    name: item.metadata?.name || "",
    namespace: item.metadata?.namespace || "",
    createdAt: new Date(item.metadata?.creationTimestamp || Date.now()),
    status: item.spec?.inferenceEngine || "Unknown",
    inferenceEngine: item.spec?.inferenceEngine || "",
    port: item.spec?.workloadPort?.port ?? 0,
    protocol: item.spec?.workloadPort?.protocol || "http",
  }), [])

  return (
    <KthenaResourcePage
      messageNamespace="modelservers"
      createKey="createResource"
      kind="ModelServer"
      apiVersion="networking.serving.volcano.sh/v1alpha1"
      defaultYaml={defaultYaml}
      statusColor={() => "bg-blue-100 text-blue-800"}
      mapItem={mapItem}
      extraColumns={[
        { accessorKey: "inferenceEngine", header: t("table.engine") },
        { accessorKey: "port", header: t("table.port") },
        { accessorKey: "protocol", header: t("table.protocol") },
      ]}
      pagination={pagination}
      onPaginationChange={setPagination}
      listQuery={listQuery}
      fetchYaml={(namespace, name) => utils.modelServersRouter.getYaml.fetch({ namespace, name })}
      fetchRelated={async (namespace, name) => {
        const related = await utils.modelServersRouter.getRelated.fetch({ namespace, name })
        return [
          { title: tr("pods"), items: relatedRefsToItems(locale, "/pods", related.pods) },
          { title: tr("modelRoutes"), items: relatedRefsToItems(locale, "/model-routes", related.modelRoutes) },
        ]
      }}
      createResource={async (manifest) => {
        await createMutation.mutateAsync({ manifest: manifest as any })
      }}
      updateResource={async ({ namespace, name, patchData }) => {
        await updateMutation.mutateAsync({ namespace, name, patchData: patchData as any })
      }}
      deleteResource={async ({ namespace, name }) => {
        await deleteMutation.mutateAsync({ namespace, name })
      }}
      extraSummary={(item) => (
        <>
          <div><span className="font-semibold">{t("details.engine")}</span> {String(item.inferenceEngine || "")}</div>
          <div><span className="font-semibold">{t("details.port")}</span> {String(item.port ?? 0)}</div>
          <div><span className="font-semibold">{t("details.protocol")}</span> {String(item.protocol || "")}</div>
        </>
      )}
    />
  )
}
