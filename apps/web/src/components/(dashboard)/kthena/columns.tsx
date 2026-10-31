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
import { ArrowUpDown, Edit, Filter, Trash2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

export type KthenaRow = {
  name: string
  namespace: string
  createdAt: Date
  status: string
  yaml?: string
  [key: string]: unknown
}

export function useKthenaColumns(options: {
  messageNamespace: string
  extraColumns?: ColumnDef<KthenaRow>[]
  availableNamespaces: string[]
  availableStatuses: string[]
  statusColor: (status: string) => string
  onEdit?: (item: KthenaRow) => void
  onDelete?: (item: KthenaRow) => void
}): ColumnDef<KthenaRow>[] {
  const t = useTranslations(options.messageNamespace)
  const tc = useTranslations("common")
  const format = useFormatter()
  const formatDateTime = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" })

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
              {options.availableNamespaces.map((namespace) => (
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
      cell: ({ row }) => (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/60">
          {row.getValue("namespace") as string}
        </Badge>
      ),
      filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
    },
    ...(options.extraColumns ?? []),
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
              {options.availableStatuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={column.getFilterValue() === status}
                  onCheckedChange={(checked) => {
                    column.setFilterValue(checked ? status : undefined)
                  }}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge className={options.statusColor(status)}>{status}</Badge>
      },
      filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-2">
            {options.onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  options.onEdit?.(item)
                }}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {options.onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  options.onDelete?.(item)
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
}
