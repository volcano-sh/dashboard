"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Filter, Trash2 } from 'lucide-react'
import { useTranslations } from "next-intl"
import { PodStatus } from "./pod-management"

interface CreateColumnsOptions {
    availableNamespaces: string[]
    availableStatuses: string[]
    onEdit?: (pod: PodStatus) => void
    onDelete?: (pod: PodStatus) => void
}

export const createColumns = ({
    availableNamespaces,
    availableStatuses,
    onEdit,
    onDelete,
    t,
    tc,
}: CreateColumnsOptions & {
    t: ReturnType<typeof useTranslations<"pods">>
    tc: ReturnType<typeof useTranslations<"common">>
}): ColumnDef<PodStatus>[] => [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("table.name")}
                    <ArrowUpDown className="ms-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: "namespace",
            header: ({ column }) => (
                <div className="flex items-center">
                    {t("table.namespace")}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="ms-2 h-8 p-1">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>{t("table.filterByNamespace")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={!column.getFilterValue()}
                                onCheckedChange={(checked) => {
                                    if (checked) column.setFilterValue(undefined)
                                }}
                            >
                                {tc("actions.all")}
                            </DropdownMenuCheckboxItem>
                            {availableNamespaces.map((namespace) => (
                                <DropdownMenuCheckboxItem
                                    key={namespace}
                                    checked={column.getFilterValue() === namespace}
                                    onCheckedChange={(checked) => {
                                        column.setFilterValue(checked ? namespace : undefined)
                                    }}
                                >
                                    {namespace}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
            cell: ({ row }) => {
                const namespace = row.getValue("namespace") as string
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/60">
                        {namespace}
                    </Badge>
                )
            },
            filterFn: (row, columnId, filterValue) => {
                return row.getValue(columnId) === filterValue
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <div className="flex items-center">
                    {t("table.status")}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="ms-2 h-8 p-1">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>{t("table.filterByStatus")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={!column.getFilterValue()}
                                onCheckedChange={(checked) => {
                                    if (checked) column.setFilterValue(undefined)
                                }}
                            >
                                {tc("actions.all")}
                            </DropdownMenuCheckboxItem>
                            {availableStatuses.map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={column.getFilterValue() === status}
                                    onCheckedChange={(checked) => {
                                        column.setFilterValue(checked ? status : undefined)
                                    }}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        className={
                            status === "running"
                                ? "bg-green-100 text-green-800"
                                : status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : status === "failed"
                                        ? "bg-red-100 text-red-800"
                                        : status === "succeeded"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                        }
                    >
                        {status}
                    </Badge>
                )
            },
            filterFn: (row, columnId, filterValue) => {
                return row.getValue(columnId) === filterValue
            },
        },
        {
            accessorKey: "age",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("table.age")}
                    <ArrowUpDown className="ms-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 font-mono">
                    {row.getValue("age") as string}
                </span>
            ),
        },
        {
            id: "actions",
            header: t("table.actions"),
            cell: ({ row }) => {
                const pod = row.original
                return (
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(pod)
                                }}
                                className="h-8 w-8 p-0"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(pod)
                                }}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

export function usePodColumns(options: CreateColumnsOptions) {
    const t = useTranslations("pods")
    const tc = useTranslations("common")

    return createColumns({
        ...options,
        t,
        tc,
    })
}
