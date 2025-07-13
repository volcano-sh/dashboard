'use client'

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
import { trpc } from "@volcano/trpc/react"
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "../data-table"
import { createColumns } from "./columns"
import { CreatePodDialog } from "./pod-create-dialog"

export type PodStatus = {
    name: string;
    namespace: string;
    createdAt: Date;
    status: string;
    age: string;
    yaml?: string; // For pod details modal
}

export default function PodManagement() {
    const [pods, setPods] = useState<PodStatus[]>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPod, setSelectedPod] = useState<PodStatus | null>(null)
    const [showPodDetails, setShowPodDetails] = useState(false)
    const [showCreatePodModal, setShowCreatePodModal] = useState(false)
    const [totalPods, setTotalPods] = useState(0)

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
    })

    const podsQuery = trpc.podRouter.getPods.useQuery(
        {
            page: pagination.page,
            pageSize: pagination.pageSize,
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching pods:", err);
                setError(`Pods API error: ${err.message}`);
            },
        }
    )


    const podYamlQuery = trpc.podRouter.getPodYaml.useQuery(
        {
            namespace: selectedPod?.namespace || "",
            name: selectedPod?.name || ""
        },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching pod YAML:", err);
                setError(`Pod YAML API error: ${err.message}`);
            },
        },
    );

    // Extract unique namespaces from pods data
    const availableNamespaces = pods ?
        Array.from(new Set(pods.map(pod => pod.namespace).filter(Boolean))).sort()
        : [];

    // Extract unique statuses from pods data
    const availableStatuses = pods ?
        Array.from(new Set(pods.map(pod => pod.status).filter(Boolean))).sort()
        : [];

    // Create dynamic columns with namespace and status filtering
    const columns = createColumns(availableNamespaces, availableStatuses);

    useEffect(() => {
        if (podsQuery.data) {
            console.log(podsQuery)
            const transformedPods: PodStatus[] = (podsQuery.data.items || []).map((pod: any) => {
                const createdAt = new Date(pod.metadata?.creationTimestamp || Date.now());
                const now = new Date();
                const ageInMs = now.getTime() - createdAt.getTime();
                const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
                const age = ageInDays === 0 ? "1d" : `${ageInDays}d`;

                return {
                    name: pod.metadata?.name || '',
                    namespace: pod.metadata?.namespace || '',
                    createdAt,
                    status: pod.status?.phase?.toLowerCase() || 'unknown',
                    age,
                    yaml: pod.yaml || '',
                };
            });

            setPods(transformedPods);
            setTotalPods(podsQuery.data.totalCount || 0);
        }
    }, [podsQuery.data]);

    const handleRefresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await podsQuery.refetch();
        } catch (err) {
            setError("Failed to refresh pods")
        } finally {
            setLoading(false)
        }
    }, [podsQuery])

    const handlePodClick = useCallback(async (pod: PodStatus) => {
        setError(null);

        try {
            const response = await podYamlQuery.refetch();
            const yaml = response.data || pod.yaml || "";
            setSelectedPod({ ...pod, yaml });
            setShowPodDetails(true);
        } catch (err) {
            setError("Failed to fetch pod YAML");
        }
    }, [podYamlQuery])

    const handlePodCreate = () => {
        setShowCreatePodModal(true)
    }

    const handlePageSizeChange = (newPageSize: string) => {
        setPagination(prev => ({
            page: 1, // Reset to first page when changing page size
            pageSize: parseInt(newPageSize),
        }));
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({
            ...prev,
            page: newPage,
        }));
    }

    const getStatusColor = (status: string) => {
        switch (status) {
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

    const isLoading = podsQuery.isLoading
    const isRefreshing = podsQuery.isRefetching

    // Calculate pagination info
    const totalPages = Math.ceil(totalPods / pagination.pageSize);
    const startItem = (pagination.page - 1) * pagination.pageSize + 1;
    const endItem = Math.min(pagination.page * pagination.pageSize, totalPods);

    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Pod Management</h1>
                <div className="flex items-center">
                    <Button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2 mr-4"
                    >
                        <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handlePodCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Pod
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
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
                    {/* Enhanced DataTable with click handlers */}
                    <div className="rounded-lg">
                        <DataTable
                            columns={columns}
                            data={pods || []}
                            onRowClick={handlePodClick}
                            disablePagination={true}
                        />
                    </div>

                    {/* Server-side Pagination Controls */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing {startItem} to {endItem} of {totalPods} results
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Page Size Selector */}
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

                            {/* Pagination Controls */}
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

                                {/* Page Numbers */}
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

            {/* Pod Details Modal */}
            <Dialog open={showPodDetails} onOpenChange={setShowPodDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Pod Details: {selectedPod?.name}
                            {selectedPod && (
                                <Badge className={getStatusColor(selectedPod.status)}>
                                    {selectedPod.status}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPod && (
                        <div className="space-y-4">
                            {/* Pod Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-semibold">Name:</span> {selectedPod.name}
                                </div>
                                <div>
                                    <span className="font-semibold">Namespace:</span> {selectedPod.namespace}
                                </div>
                                <div>
                                    <span className="font-semibold">Created:</span> {selectedPod.createdAt.toLocaleString()}
                                </div>
                                <div>
                                    <span className="font-semibold">Age:</span> {selectedPod.age}
                                </div>
                                <div>
                                    <span className="font-semibold">Status:</span>
                                    <Badge className={`ml-2 ${getStatusColor(selectedPod.status)}`}>
                                        {selectedPod.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* YAML Configuration */}
                            <div>
                                <h3 className="font-semibold mb-2">YAML Configuration</h3>
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{selectedPod.yaml}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <CreatePodDialog open={showCreatePodModal} setOpen={setShowCreatePodModal} />
        </div>
    )
}
