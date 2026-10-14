"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Filter } from "lucide-react";
import { ModelServingStatus } from "./modelserving-management";
import { useFormatter, useTranslations } from "next-intl";

interface CreateColumnsOptions {
  availableNamespaces: string[];
  availableRecoveryPolicies: string[];
  availableStatuses: string[];
}

export const createColumns = ({
  availableNamespaces,
  availableRecoveryPolicies,
  availableStatuses,
  t,
  tc,
  formatDateTime,
}: CreateColumnsOptions & {
  t: ReturnType<typeof useTranslations<"devices">>;
  tc: ReturnType<typeof useTranslations<"common">>;
  formatDateTime: (date: Date) => string;
}): ColumnDef<ModelServingStatus>[] => [
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
                if (checked) column.setFilterValue(undefined);
              }}
            >
              {tc("actions.all")}
            </DropdownMenuCheckboxItem>
            {availableNamespaces.map((namespace) => (
              <DropdownMenuCheckboxItem
                key={namespace}
                checked={column.getFilterValue() === namespace}
                onCheckedChange={(checked) => {
                  column.setFilterValue(checked ? namespace : undefined);
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
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/60">
          {namespace}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      return row.getValue(columnId) === filterValue;
    },
  },
  {
    accessorKey: "replicas",
    header: t("table.replicas"),
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {item.availableReplicas} / {item.replicas}
        </Badge>
      );
    },
  },
  {
    accessorKey: "recoveryPolicy",
    header: ({ column }) => (
      <div className="flex items-center">
        {t("table.recoveryPolicy")}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="ms-2 h-8 p-1">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>
              {t("table.filterByRecoveryPolicy")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={!column.getFilterValue()}
              onCheckedChange={(checked) => {
                if (checked) column.setFilterValue(undefined);
              }}
            >
              {tc("actions.all")}
            </DropdownMenuCheckboxItem>
            {availableRecoveryPolicies.map((policy) => (
              <DropdownMenuCheckboxItem
                key={policy}
                checked={column.getFilterValue() === policy}
                onCheckedChange={(checked) => {
                  column.setFilterValue(checked ? policy : undefined);
                }}
              >
                {policy}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    cell: ({ row }) => {
      const policy = (row.getValue("recoveryPolicy") as string) || "RoleRecreate";
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100/80">
          {policy}
        </Badge>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      return row.getValue(columnId) === filterValue;
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
      const createdAt = row.getValue("createdAt") as Date;
      return formatDateTime(createdAt);
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
                if (checked) column.setFilterValue(undefined);
              }}
            >
              {tc("actions.all")}
            </DropdownMenuCheckboxItem>
            {availableStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={column.getFilterValue() === status}
                onCheckedChange={(checked) => {
                  column.setFilterValue(checked ? status : undefined);
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
      const status = row.getValue("status") as string;
      let badgeStyle = "bg-gray-100 text-gray-800";
      if (status === "Available") {
        badgeStyle = "bg-green-100 text-green-800";
      } else if (status === "Progressing") {
        badgeStyle = "bg-blue-100 text-blue-800";
      } else if (status === "UpdateInProgress") {
        badgeStyle = "bg-yellow-100 text-yellow-800";
      } else if (status === "Failed") {
        badgeStyle = "bg-red-100 text-red-800";
      }

      return <Badge className={badgeStyle}>{status}</Badge>;
    },
    filterFn: (row, columnId, filterValue) => {
      return row.getValue(columnId) === filterValue;
    },
  },
];

export function useModelServingColumns(options: CreateColumnsOptions) {
  const t = useTranslations("devices");
  const tc = useTranslations("common");
  const format = useFormatter();

  const formatDateTime = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });

  return createColumns({
    ...options,
    t,
    tc,
    formatDateTime,
  });
}
