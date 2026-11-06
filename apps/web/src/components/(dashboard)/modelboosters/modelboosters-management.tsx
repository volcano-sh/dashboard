"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KthenaResourcePage } from "@/components/(dashboard)/kthena/kthena-resource-page"
import { relatedRefsToItems } from "@/lib/kthena-links"
import { trpc } from "@volcano/trpc/react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useState } from "react"

const defaultYaml = `apiVersion: workload.serving.volcano.sh/v1alpha1
kind: ModelBooster
metadata:
  name: demo
  namespace: default
spec:
  backend:
    name: backend1
    type: vLLM
    modelURI: hf://Qwen/Qwen2.5-0.5B-Instruct
    cacheURI: hostpath://tmp/cache
    replicas: 1
    workers:
      - type: server
        image: vllm/vllm-openai-cpu:latest
        replicas: 1
        pods: 1
`

function boosterStatusColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-800"
    case "Failed":
      return "bg-red-100 text-red-800"
    case "Initialized":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ModelBoostersManagement() {
  const t = useTranslations("modelboosters")
  const tr = useTranslations("common.related")
  const locale = useLocale()
  const utils = trpc.useUtils()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const listQuery = trpc.modelBoostersRouter.list.useQuery(pagination, {
    keepPreviousData: true,
    onError: (err) => console.error(err),
  })
  const createMutation = trpc.modelBoostersRouter.create.useMutation()
  const updateMutation = trpc.modelBoostersRouter.update.useMutation()
  const deleteMutation = trpc.modelBoostersRouter.delete.useMutation()

  const mapItem = useCallback((item: any) => {
    const conditions = item.status?.conditions ?? []
    const isTrue = (type: string) =>
      conditions.some((c: any) => c.type === type && c.status === "True")
    let status = "Unknown"
    if (isTrue("Failed")) status = "Failed"
    else if (isTrue("Active")) status = "Active"
    else if (isTrue("Initialized")) status = "Initialized"
    return {
      name: item.metadata?.name || "",
      namespace: item.metadata?.namespace || "",
      createdAt: new Date(item.metadata?.creationTimestamp || Date.now()),
      status,
      backendType: item.spec?.backend?.type || "",
      replicas: item.spec?.backend?.replicas ?? 0,
    }
  }, [])

  return (
    <KthenaResourcePage
      messageNamespace="modelboosters"
      createKey="createResource"
      kind="ModelBooster"
      apiVersion="workload.serving.volcano.sh/v1alpha1"
      defaultYaml={defaultYaml}
      statusColor={boosterStatusColor}
      mapItem={mapItem}
      extraColumns={[
        { accessorKey: "backendType", header: t("table.backend") },
        { accessorKey: "replicas", header: t("table.replicas") },
      ]}
      pagination={pagination}
      onPaginationChange={setPagination}
      listQuery={listQuery}
      fetchYaml={(namespace, name) => utils.modelBoostersRouter.getYaml.fetch({ namespace, name })}
      fetchRelated={async (namespace, name) => {
        const related = await utils.modelBoostersRouter.getRelated.fetch({ namespace, name })
        return [
          { title: tr("modelServings"), items: relatedRefsToItems(locale, "/model-servings", related.modelServings) },
          { title: tr("modelServers"), items: relatedRefsToItems(locale, "/model-servers", related.modelServers) },
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
          <div><span className="font-semibold">{t("details.backend")}</span> {String(item.backendType || "")}</div>
          <div><span className="font-semibold">{t("details.replicas")}</span> {String(item.replicas ?? 0)}</div>
        </>
      )}
    />
  )
}
