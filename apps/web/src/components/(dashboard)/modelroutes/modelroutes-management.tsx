"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { KthenaResourcePage } from "@/components/(dashboard)/kthena/kthena-resource-page"
import { relatedRefsToItems } from "@/lib/kthena-links"
import { trpc } from "@volcano/trpc/react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useState } from "react"

const defaultYaml = `apiVersion: networking.serving.volcano.sh/v1alpha1
kind: ModelRoute
metadata:
  name: demo-route
  namespace: default
spec:
  modelName: demo
  rules:
    - name: default
      targetModels:
        - modelServerName: demo-server
`

export default function ModelRoutesManagement() {
  const t = useTranslations("modelroutes")
  const tr = useTranslations("common.related")
  const locale = useLocale()
  const utils = trpc.useUtils()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const listQuery = trpc.modelRoutesRouter.list.useQuery(pagination, {
    keepPreviousData: true,
    onError: (err) => console.error(err),
  })
  const createMutation = trpc.modelRoutesRouter.create.useMutation()
  const updateMutation = trpc.modelRoutesRouter.update.useMutation()
  const deleteMutation = trpc.modelRoutesRouter.delete.useMutation()

  const mapItem = useCallback((item: any) => {
    const rules = item.spec?.rules ?? []
    const firstServer = rules[0]?.targetModels?.find((tm: any) => tm.modelServerName)?.modelServerName || ""
    return {
      name: item.metadata?.name || "",
      namespace: item.metadata?.namespace || "",
      createdAt: new Date(item.metadata?.creationTimestamp || Date.now()),
      status: item.spec?.modelName || "Unknown",
      modelName: item.spec?.modelName || "",
      ruleCount: rules.length,
      firstModelServerName: firstServer,
    }
  }, [])

  return (
    <KthenaResourcePage
      messageNamespace="modelroutes"
      createKey="createResource"
      kind="ModelRoute"
      apiVersion="networking.serving.volcano.sh/v1alpha1"
      defaultYaml={defaultYaml}
      statusColor={() => "bg-blue-100 text-blue-800"}
      mapItem={mapItem}
      extraColumns={[
        { accessorKey: "modelName", header: t("table.modelName") },
        { accessorKey: "ruleCount", header: t("table.rules") },
        { accessorKey: "firstModelServerName", header: t("table.modelServer") },
      ]}
      pagination={pagination}
      onPaginationChange={setPagination}
      listQuery={listQuery}
      fetchYaml={(namespace, name) => utils.modelRoutesRouter.getYaml.fetch({ namespace, name })}
      fetchRelated={async (namespace, name) => {
        const related = await utils.modelRoutesRouter.getRelated.fetch({ namespace, name })
        return [
          { title: tr("modelServers"), items: relatedRefsToItems(locale, "/model-servers", related.modelServers) },
          { title: tr("parentRefs"), items: (related.parentRefs ?? []).map((text) => ({ text })) },
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
          <div><span className="font-semibold">{t("details.modelName")}</span> {String(item.modelName || "")}</div>
          <div><span className="font-semibold">{t("details.rules")}</span> {String(item.ruleCount ?? 0)}</div>
          <div><span className="font-semibold">{t("details.modelServer")}</span> {String(item.firstModelServerName || "")}</div>
        </>
      )}
    />
  )
}
