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
import { QueueStatus } from "./queue-management"

export const columns: ColumnDef<QueueStatus>[] = [
    {
        accessorKey: "name",
        header: () => (
                <span>Name</span>
        ),
    },
    {
        accessorKey: "parent",
        header: () => (
            <span>
                Parent
            </span>

        ),
        cell: ({ row }) => {
            const parent = row.getValue("parent") as string;
            return (
                <Badge
                    className="bg-blue-100 text-blue-800 hover:bg-blue-100/60"
                >
                    {parent}
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
        accessorKey: "state",
        header: ({ column }) => (
            <div className="flex items-center">
                State
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-2 h-8 p-1">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Filter by State</DropdownMenuLabel>
                        <DropdownMenuSeparator />
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
] 