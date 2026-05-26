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
import { PodGroupStatus } from "./podgroup-management"

interface CreateColumnsOptions {
    availableNamespaces: string[]
    availableStatuses: string[]
}

export const createColumns = ({
    availableNamespaces,
    availableStatuses,
}: CreateColumnsOptions): ColumnDef<PodGroupStatus>[] => [
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
                        className="bg-blue-100 text-blue-800 hover:bg-blue-100/60"
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
            header: "Queue",
            cell: ({ row }) => {
                const queue = row.getValue("queue") as string;
                return (
                    <span className="text-sm text-gray-600">
                        {queue || "N/A"}
                    </span>
                );
            },
        },
        {
            accessorKey: "minMember",
            header: "Min Member",
            cell: ({ row }) => {
                const minMember = row.getValue("minMember") as number;
                return (
                    <span className="text-sm text-gray-600">
                        {minMember ?? "N/A"}
                    </span>
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

export const columns = createColumns({ availableNamespaces: [], availableStatuses: [] })

