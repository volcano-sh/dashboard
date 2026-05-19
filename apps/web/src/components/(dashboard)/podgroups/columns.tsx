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
import { ArrowUpDown, Filter } from 'lucide-react'
import { useFormatter, useTranslations } from "next-intl"
import { PodGroupStatus } from "./podgroup-management"

interface CreateColumnsOptions {
    availableNamespaces: string[]
    availableStatuses: string[]
}

export const createColumns = ({
    availableNamespaces,
    availableStatuses,
    t,
    tc,
    formatDateTime,
}: CreateColumnsOptions & {
    t: ReturnType<typeof useTranslations<"podgroups">>
    tc: ReturnType<typeof useTranslations<"common">>
    formatDateTime: (date: Date) => string
}): ColumnDef<PodGroupStatus>[] => [
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
            accessorKey: "queue",
            header: t("table.queue"),
            cell: ({ row }) => {
                const queue = row.getValue("queue") as string
                return (
                    <span className="text-sm text-gray-600">
                        {queue || tc("notAvailable")}
                    </span>
                )
            },
        },
        {
            accessorKey: "minMember",
            header: t("table.minMember"),
            cell: ({ row }) => {
                const minMember = row.getValue("minMember") as number
                return (
                    <span className="text-sm text-gray-600">
                        {minMember ?? tc("notAvailable")}
                    </span>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("table.creationTime")}
                    <ArrowUpDown className="ms-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => formatDateTime(row.getValue("createdAt") as Date),
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
                            status === "Running" || status === "running"
                                ? "bg-green-100 text-green-800"
                                : status === "Pending" || status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : status === "Failed" || status === "failed"
                                        ? "bg-red-100 text-red-800"
                                        : status === "Succeeded" || status === "succeeded"
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
    ]

export function usePodGroupColumns(options: CreateColumnsOptions) {
    const t = useTranslations("podgroups")
    const tc = useTranslations("common")
    const format = useFormatter()

    const formatDateTime = (date: Date) =>
        format.dateTime(date, { dateStyle: "medium", timeStyle: "short" })

    return createColumns({
        ...options,
        t,
        tc,
        formatDateTime,
    })
}
