"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@volcano/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ListPagination } from "../list-pagination";
import { RefreshCw, Search, History } from "lucide-react";

export default function AuditManagement() {
  const t = useTranslations("audit");
  const tc = useTranslations("common");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState<string>("ALL");

  const auditQuery = trpc.auditRouter.getAuditEvents.useQuery(
    {
      page,
      pageSize,
      search: search || undefined,
      resourceType: resourceType === "ALL" ? undefined : resourceType,
    },
    {
      keepPreviousData: true,
    },
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {t("actions.CREATE")}
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
            {t("actions.UPDATE")}
          </Badge>
        );
      case "DELETE":
        return <Badge variant="destructive">{t("actions.DELETE")}</Badge>;
      case "STATUS_CHANGE":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white">
            {t("actions.STATUS_CHANGE")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const data = auditQuery.data;
  const isLoading = auditQuery.isLoading;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => auditQuery.refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {tc("refresh") || "Refresh"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={resourceType}
            onValueChange={(val) => {
              setResourceType(val);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allTypes")}</SelectItem>
              <SelectItem value="Job">
                {t("filters.resourceTypes.Job")}
              </SelectItem>
              <SelectItem value="Queue">
                {t("filters.resourceTypes.Queue")}
              </SelectItem>
              <SelectItem value="Pod">
                {t("filters.resourceTypes.Pod")}
              </SelectItem>
              <SelectItem value="PodGroup">
                {t("filters.resourceTypes.PodGroup")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.timestamp")}</TableHead>
              <TableHead>{t("columns.user")}</TableHead>
              <TableHead>{t("columns.action")}</TableHead>
              <TableHead>{t("columns.resourceType")}</TableHead>
              <TableHead>{t("columns.resourceName")}</TableHead>
              <TableHead>{t("columns.namespace")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <History className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <p className="font-medium">{t("emptyState.noRecords")}</p>
                    <p className="text-xs">{t("emptyState.description")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {event.user}
                    </span>
                  </TableCell>
                  <TableCell>{getActionBadge(event.action)}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    {event.resourceType}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">
                    {event.resourceName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.namespace || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <ListPagination
          currentPage={page}
          totalPages={data.totalPages}
          pageSize={pageSize}
          totalItems={data.totalCount}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
