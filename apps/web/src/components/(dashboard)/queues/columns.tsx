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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Edit, Filter, Trash2 } from 'lucide-react'
import { isProtectedQueue, protectedQueueDeleteMessage } from "@/lib/queue-constants"
import { useFormatter, useTranslations } from "next-intl"
import { QueueStatus } from "./queue-management"

interface CreateColumnsOptions {
    onEdit?: (queue: QueueStatus) => void
    onDelete?: (queue: QueueStatus) => void
}

export const createColumns = ({
    onEdit,
    onDelete,
    t,
    tc,
    formatDateTime,
}: CreateColumnsOptions & {
    t: ReturnType<typeof useTranslations<"queues">>
    tc: ReturnType<typeof useTranslations<"common">>
    formatDateTime: (date: Date) => string
}): ColumnDef<QueueStatus>[] => [
    {
        accessorKey: "name",
        header: () => <span>{t("table.name")}</span>,
    },
    {
        accessorKey: "parent",
        header: () => <span>{t("table.parent")}</span>,
        cell: ({ row }) => {
            const parent = row.getValue("parent") as string
            return (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/60">
                    {parent}
                </Badge>
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
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as Date
            return formatDateTime(createdAt)
        },
    },
    {
        accessorKey: "state",
        header: ({ column }) => (
            <div className="flex items-center">
                {t("table.state")}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ms-2 h-8 p-1">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>{t("table.state")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={!column.getFilterValue()}
                            onCheckedChange={(checked) => {
                                if (checked) column.setFilterValue(undefined)
                            }}
                        >
                            {tc("actions.all")}
                        </DropdownMenuCheckboxItem>
                        {["open", "closed", "maintenance"].map((state) => (
                            <DropdownMenuCheckboxItem
                                key={state}
                                checked={column.getFilterValue() === state}
                                onCheckedChange={(checked) => {
                                    column.setFilterValue(checked ? state : undefined)
                                }}
                            >
                                {state.charAt(0).toUpperCase() + state.slice(1)}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
        cell: ({ row }) => {
            const state = row.getValue("state") as string
            return (
                <Badge
                    className={
                        state === "open"
                            ? "bg-green-100 text-green-800"
                            : state === "closed"
                                ? "bg-red-100 text-red-800"
                                : state === "maintenance"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                    }
                >
                    {state}
                </Badge>
            )
        },
        filterFn: (row, columnId, filterValue) => {
            return row.getValue(columnId) === filterValue
        },
    },
    {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => {
            const queue = row.original
            const isDeleteDisabled = isProtectedQueue(queue.name)

            return (
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onEdit(queue)
                                        }}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("edit.button")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {onDelete && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!isDeleteDisabled) {
                                                    onDelete(queue)
                                                }
                                            }}
                                            disabled={isDeleteDisabled}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                      {isDeleteDisabled
                                        ? protectedQueueDeleteMessage(queue.name)
                                        : "Delete queue"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            )
        },
    },
]

export function useQueueColumns(options: CreateColumnsOptions) {
    const t = useTranslations("queues")
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
