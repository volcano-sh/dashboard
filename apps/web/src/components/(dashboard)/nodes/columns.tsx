"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

export type NodeStatus = {
    name: string
    status: string
    roles: string[]
    capacity: { cpu: string, memory: string }
    allocatable: { cpu: string, memory: string }
    os: string
    architecture: string
}

export function useNodeColumns() {
    const t = useTranslations("nodes")

    const columns: ColumnDef<NodeStatus>[] = [
        {
            accessorKey: "name",
            header: () => <div className="text-left font-semibold">{t("columns.name")}</div>,
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "status",
            header: () => <div className="text-left font-semibold">{t("columns.status")}</div>,
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={status === "Ready" ? "default" : "destructive"}>
                        {status}
                    </Badge>
                )
            },
        },
        {
            id: "cpu",
            header: () => <div className="text-left font-semibold">{t("columns.cpu")}</div>,
            cell: ({ row }) => {
                const node = row.original
                return <div>{node.allocatable.cpu} / {node.capacity.cpu}</div>
            },
        },
        {
            id: "memory",
            header: () => <div className="text-left font-semibold">{t("columns.memory")}</div>,
            cell: ({ row }) => {
                const node = row.original
                return <div>{node.allocatable.memory} / {node.capacity.memory}</div>
            },
        },
        {
            id: "os",
            header: () => <div className="text-left font-semibold">{t("columns.os")}</div>,
            cell: ({ row }) => {
                const node = row.original
                return <div>{node.os} / {node.architecture}</div>
            },
        },
        {
            accessorKey: "roles",
            header: () => <div className="text-left font-semibold">{t("columns.roles")}</div>,
            cell: ({ row }) => {
                const roles = row.getValue("roles") as string[]
                return (
                    <div className="flex gap-1 flex-wrap">
                        {roles.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                                {role}
                            </Badge>
                        ))}
                    </div>
                )
            },
        },
    ]

    return columns
}
