"use client"

import { useTranslations, useFormatter } from "next-intl"
import { useState } from "react"
import { trpc } from "@volcano/trpc/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"
import { DataTable } from "../data-table"
import { useNodeColumns, NodeStatus } from "./columns"

export default function NodesManagement() {
    const t = useTranslations("nodes")
    const tc = useTranslations("common")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const nodesQuery = trpc.nodesRouter.getNodes.useQuery(undefined, {
        keepPreviousData: true,
        onError: (err) => {
            console.error("Error fetching nodes:", err)
            setError(t("errors.api", { message: err.message }))
        }
    })

    const columns = useNodeColumns()

    const handleRefresh = async () => {
        setLoading(true)
        setError(null)
        try {
            await nodesQuery.refetch()
        } catch (err) {
            setError(t("errors.refresh"))
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const isLoading = nodesQuery.isLoading
    const isRefreshing = nodesQuery.isRefetching

    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t("title")}</h1>
                <Button
                    onClick={handleRefresh}
                    disabled={loading || isRefreshing}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                    {tc("actions.refresh")}
                </Button>
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
                </div>
            ) : (
                <div className="rounded-lg">
                    <DataTable
                        columns={columns}
                        data={(nodesQuery.data as NodeStatus[]) || []}
                        disablePagination={true}
                        filterPlaceholder={t("filterPlaceholder")}
                    />
                </div>
            )}
        </div>
    )
}
