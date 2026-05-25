'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { trpc } from "@volcano/trpc/react"
import { useFormatter, useTranslations } from "next-intl"
import { RefreshCw, Search, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { usePaginationClamp } from "@/hooks/use-pagination-clamp"
import { ListPagination } from "../list-pagination"
import { DataTable } from "../data-table"
import { ServerPagination } from "../server-pagination"
import { usePodGroupColumns } from "./columns"

export type PodGroupStatus = {
    name: string;
    namespace: string;
    queue: string;
    minMember: number;
    createdAt: Date;
    status: string;
    yaml?: string;
}

export default function PodGroupManagement() {
    const t = useTranslations("podgroups")
    const tc = useTranslations("common")
    const format = useFormatter()
    const [podGroups, setPodGroups] = useState<PodGroupStatus[]>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPodGroup, setSelectedPodGroup] = useState<PodGroupStatus | null>(null)
    const [showPodGroupDetails, setShowPodGroupDetails] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [namespaceFilter, setNamespaceFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
    })

    const podGroupsQuery = trpc.podgroupsRouter.getPodGroups.useQuery(
        {
            namespace: namespaceFilter || "",
            search: searchTerm || "",
            status: statusFilter || "",
            page: pagination.page,
            pageSize: pagination.pageSize,
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching podgroups:", err);
                setError(t("errors.api", { message: err.message }));
            },
        }
    )

    const podGroupYamlQuery = trpc.podgroupsRouter.getPodGroupYaml.useQuery(
        {
            namespace: selectedPodGroup?.namespace || "",
            name: selectedPodGroup?.name || ""
        },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching podgroup YAML:", err);
                setError(t("errors.yamlApi", { message: err.message }));
            },
        },
    );

    const availableNamespaces = podGroups ?
        Array.from(new Set(podGroups.map(pg => pg.namespace).filter(Boolean))).sort()
        : [];

    const availableStatuses = podGroups ?
        Array.from(new Set(podGroups.map(pg => pg.status).filter(Boolean))).sort()
        : [];

    const columns = usePodGroupColumns({
        availableNamespaces,
        availableStatuses,
    });

    useEffect(() => {
        if (podGroupsQuery.data) {
            const transformedPodGroups: PodGroupStatus[] = (podGroupsQuery.data.items || [])
                .map((pg: any) => {
                    const createdAt = new Date(pg.metadata?.creationTimestamp || Date.now());

                    return {
                        name: pg.metadata?.name || '',
                        namespace: pg.metadata?.namespace || '',
                        queue: pg.spec?.queue || '',
                        minMember: pg.spec?.minMember || 0,
                        createdAt,
                        status: pg.status?.phase || 'Unknown',
                        yaml: pg.yaml || '',
                    };
                });

            setPodGroups(transformedPodGroups);
        }
    }, [podGroupsQuery.data]);

    const listTotal = podGroupsQuery.data?.total ?? 0;
    const listTotalPages = podGroupsQuery.data?.totalPages ?? 0;
    const listPage = podGroupsQuery.data?.page ?? pagination.page;

    usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
        setPagination((prev) => ({ ...prev, page }))
    );

    const handleRefresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await podGroupsQuery.refetch();
        } catch (err) {
            setError(t("errors.refresh"))
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [podGroupsQuery])

    const handlePodGroupClick = useCallback(async (podGroup: PodGroupStatus) => {
        setError(null);

        try {
            const response = await podGroupYamlQuery.refetch();
            const yaml = response.data || podGroup.yaml || "";
            setSelectedPodGroup({ ...podGroup, yaml });
            setShowPodGroupDetails(true);
        } catch (err) {
            setError(t("errors.fetchYaml"));
            console.error(err)
        }
    }, [podGroupYamlQuery])

    const handlePageSizeChange = (newPageSize: string) => {
        setPagination({
            page: 1,
            pageSize: parseInt(newPageSize),
        });
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({
            ...prev,
            page: newPage,
        }));
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "running":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "failed":
                return "bg-red-100 text-red-800"
            case "succeeded":
                return "bg-blue-100 text-blue-800"
            case "unknown":
                return "bg-gray-100 text-gray-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const isLoading = podGroupsQuery.isLoading
    const isRefreshing = podGroupsQuery.isRefetching

    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t("title")}</h1>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                        {tc("actions.refresh")}
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPagination({ ...pagination, page: 1 });
                        }}
                        className="ps-10"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute end-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => {
                                setSearchTerm("");
                                setPagination({ ...pagination, page: 1 });
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <Select
                    value={namespaceFilter || "All"}
                    onValueChange={(value) => {
                        setNamespaceFilter(value === "All" ? "" : value);
                        setPagination({ ...pagination, page: 1 });
                    }}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t("namespacePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">{t("allNamespaces")}</SelectItem>
                        {availableNamespaces.map((ns) => (
                            <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={statusFilter || "All"}
                    onValueChange={(value) => {
                        setStatusFilter(value === "All" ? "" : value);
                        setPagination({ ...pagination, page: 1 });
                    }}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t("statusPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">{t("allStatuses")}</SelectItem>
                        {availableStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <>
                    <div className="rounded-lg">
                        <DataTable
                            columns={columns}
                            data={podGroups || []}
                            onRowClick={handlePodGroupClick}
                            disablePagination={true}
                            filterPlaceholder={t("filterPlaceholder")}
                        />
                    </div>

                    <ListPagination
                        page={listPage}
                        pageSize={pagination.pageSize}
                        total={listTotal}
                        totalPages={listTotalPages}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        disabled={isRefreshing}
                    />
                </>
            )}

            <Dialog open={showPodGroupDetails} onOpenChange={setShowPodGroupDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {t("details.title", { name: selectedPodGroup?.name ?? "" })}
                            {selectedPodGroup && (
                                <Badge className={getStatusColor(selectedPodGroup.status)}>
                                    {selectedPodGroup.status}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPodGroup && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-semibold">{tc("details.name")}</span> {selectedPodGroup.name}
                                </div>
                                <div>
                                    <span className="font-semibold">{tc("details.namespace")}</span> {selectedPodGroup.namespace}
                                </div>
                                <div>
                                    <span className="font-semibold">{tc("details.queue")}</span> {selectedPodGroup.queue || tc("notAvailable")}
                                </div>
                                <div>
                                    <span className="font-semibold">{t("details.minMember")}</span> {selectedPodGroup.minMember ?? tc("notAvailable")}
                                </div>
                                <div>
                                    <span className="font-semibold">{tc("details.created")}</span>{" "}{format.dateTime(selectedPodGroup.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                                </div>
                                <div>
                                    <span className="font-semibold">{tc("details.state")}</span>
                                    <Badge className={`ms-2 ${getStatusColor(selectedPodGroup.status)}`}>
                                        {selectedPodGroup.status}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">{tc("details.yamlConfiguration")}</h3>
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{selectedPodGroup.yaml}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

