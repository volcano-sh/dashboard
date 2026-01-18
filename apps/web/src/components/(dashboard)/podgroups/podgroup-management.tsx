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
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "../data-table"
import { createColumns } from "./columns"

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
    const [podGroups, setPodGroups] = useState<PodGroupStatus[]>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPodGroup, setSelectedPodGroup] = useState<PodGroupStatus | null>(null)
    const [showPodGroupDetails, setShowPodGroupDetails] = useState(false)
    const [totalPodGroups, setTotalPodGroups] = useState(0)
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
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching podgroups:", err);
                setError(`PodGroups API error: ${err.message}`);
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
                setError(`PodGroup YAML API error: ${err.message}`);
            },
        },
    );

    const availableNamespaces = podGroups ?
        Array.from(new Set(podGroups.map(pg => pg.namespace).filter(Boolean))).sort()
        : [];

    const availableStatuses = podGroups ?
        Array.from(new Set(podGroups.map(pg => pg.status).filter(Boolean))).sort()
        : [];

    const columns = createColumns({
        availableNamespaces,
        availableStatuses,
    });

    useEffect(() => {
        if (podGroupsQuery.data) {
            const transformedPodGroups: PodGroupStatus[] = (podGroupsQuery.data.items || [])
                .filter((pg: any) => {
                    return !pg.metadata?.deletionTimestamp;
                })
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
            setTotalPodGroups(transformedPodGroups.length);
        }
    }, [podGroupsQuery.data]);

    const handleRefresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await podGroupsQuery.refetch();
        } catch (err) {
            setError("Failed to refresh podgroups")
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
            setError("Failed to fetch podgroup YAML");
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalPodGroups / pagination.pageSize);
    const startItem = (pagination.page - 1) * pagination.pageSize + 1;
    const endItem = Math.min(pagination.page * pagination.pageSize, totalPodGroups);

    // Filter and paginate locally
    const filteredPodGroups = podGroups || [];
    const paginatedPodGroups = filteredPodGroups.slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
    );

    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">PodGroup Management</h1>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search podgroups..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPagination({ ...pagination, page: 1 });
                        }}
                        className="pl-10"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
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
                        <SelectValue placeholder="Namespace" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Namespaces</SelectItem>
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
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
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
                            data={paginatedPodGroups}
                            onRowClick={handlePodGroupClick}
                            disablePagination={true}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing {startItem} to {endItem} of {totalPodGroups} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Show:</span>
                                <Select
                                    value={pagination.pageSize.toString()}
                                    onValueChange={handlePageSizeChange}
                                >
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = pagination.page - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="w-8 h-8"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <Dialog open={showPodGroupDetails} onOpenChange={setShowPodGroupDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            PodGroup Details: {selectedPodGroup?.name}
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
                                    <span className="font-semibold">Name:</span> {selectedPodGroup.name}
                                </div>
                                <div>
                                    <span className="font-semibold">Namespace:</span> {selectedPodGroup.namespace}
                                </div>
                                <div>
                                    <span className="font-semibold">Queue:</span> {selectedPodGroup.queue || "N/A"}
                                </div>
                                <div>
                                    <span className="font-semibold">Min Member:</span> {selectedPodGroup.minMember || "N/A"}
                                </div>
                                <div>
                                    <span className="font-semibold">Created:</span> {selectedPodGroup.createdAt.toLocaleString()}
                                </div>
                                <div>
                                    <span className="font-semibold">Status:</span>
                                    <Badge className={`ml-2 ${getStatusColor(selectedPodGroup.status)}`}>
                                        {selectedPodGroup.status}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">YAML Configuration</h3>
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

