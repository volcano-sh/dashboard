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
import { JobStatus } from "./jobs-management"

interface CreateColumnsOptions {
  availableNamespaces: string[]
  availableQueues: string[]
  availableStatuses: string[]
  onEdit?: (job: JobStatus) => void
  onDelete?: (job: JobStatus) => void
}

export const createColumns = ({
  availableNamespaces,
  availableQueues,
  availableStatuses,
  onEdit,
  onDelete
}: CreateColumnsOptions): ColumnDef<JobStatus>[] => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "namespace",
      header: ({ column }) => (
        <div className="flex items-center">
          Namespace
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-8 p-1">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Namespace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!column.getFilterValue()}
                onCheckedChange={(checked) => {
                  if (checked) column.setFilterValue(undefined)
                }}
              >
                All
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
        const namespace = row.getValue("namespace") as string;
        return (
          <Badge
            className="bg-purple-100 text-purple-800 hover:bg-purple-100/60"
          >
            {namespace}
          </Badge>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        return row.getValue(columnId) === filterValue
      },
    },
    {
      accessorKey: "queue",
      header: ({ column }) => (
        <div className="flex items-center">
          Queue
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-8 p-1">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Queue</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!column.getFilterValue()}
                onCheckedChange={(checked) => {
                  if (checked) column.setFilterValue(undefined)
                }}
              >
                All
              </DropdownMenuCheckboxItem>
              {availableQueues.map((queue) => (
                <DropdownMenuCheckboxItem
                  key={queue}
                  checked={column.getFilterValue() === queue}
                  onCheckedChange={(checked) => {
                    column.setFilterValue(checked ? queue : undefined)
                  }}
                >
                  {queue}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      cell: ({ row }) => {
        const queue = row.getValue("queue") as string;
        return (
          <Badge
            className="bg-blue-100 text-blue-800 hover:bg-blue-100/60 "
          >
            {queue}
          </Badge>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        return row.getValue(columnId) === filterValue
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Creation Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as Date
        return new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(createdAt)
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <div className="flex items-center">
          Status
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-8 p-1">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!column.getFilterValue()}
                onCheckedChange={(checked) => {
                  if (checked) column.setFilterValue(undefined)
                }}
              >
                All
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
              status === "completed"
                ? "bg-green-100 text-green-800"
                : status === "running"
                  ? "bg-blue-100 text-blue-800"
                  : status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const job = row.original

        return (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(job)
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
                  onDelete(job)
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

export const columns = createColumns({
  availableNamespaces: [],
  availableQueues: [],
  availableStatuses: []
})
