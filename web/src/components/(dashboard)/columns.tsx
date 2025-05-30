"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Filter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<any>[] = [
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
    header: "Namespace",
  },
  {
    accessorKey: "queue",
    header: "Queue",
    cell: ({ row }) => {
        const queue = row.getValue("queue") as string;
        return (
          <Badge
            className={
              queue.includes("high")
                ? "bg-red-100 text-red-800"
                : queue.includes("medium")
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }
          >
            {queue.charAt(0).toUpperCase() + queue.slice(1)}
          </Badge>
        );
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
            {["pending", "running", "completed", "failed"].map((status) => (
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
]
