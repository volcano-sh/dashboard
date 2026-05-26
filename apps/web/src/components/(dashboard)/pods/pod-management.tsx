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
import { Skeleton } from "@/components/ui/skeleton"
import { usePaginationClamp } from "@/hooks/use-pagination-clamp"
import { trpc } from "@volcano/trpc/react"
import { Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { ListPagination } from "../list-pagination"
import { DataTable } from "../data-table"
import { createColumns } from "./columns"
import { CreatePodDialog } from "./pod-create-dialog"
import { PodEditDialog } from "./pod-edit-dialog"



export type PodStatus = {
    name: string;
    namespace: string;
    createdAt: Date;
    status: string;
    age: string;
    yaml?: string;
}

export default function PodManagement() {
    const [pods, setPods] = useState<PodStatus[]>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPod, setSelectedPod] = useState<PodStatus | null>(null)
    const [showPodDetails, setShowPodDetails] = useState(false)
    const [showCreatePodModal, setShowCreatePodModal] = useState(false)
    const [showEditPodModal, setShowEditPodModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [podToEdit, setPodToEdit] = useState<PodStatus | null>(null)
    const [podToDelete, setPodToDelete] = useState<PodStatus | null>(null)

    const utils = trpc.useUtils()

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




    const availableNamespaces = pods ?
        Array.from(new Set(pods.map(pod => pod.namespace).filter(Boolean))).sort()
        : [];

    const availableStatuses = pods ?
        Array.from(new Set(pods.map(pod => pod.status).filter(Boolean))).sort()
        : [];

    const { mutateAsync: deletePod, isPending: isDeleting } = trpc.podRouter.deletePod.useMutation({
        onSuccess: async () => {
            const deletedPodName = podToDelete?.name
            setShowDeleteConfirm(false)

            setPodToDelete(null)
            setError(null)

            setTimeout(async () => {
                await handleRefresh()
            }, 2000)

            console.log(`Pod "${deletedPodName}" deleted successfully`)
        },
        onError: (error) => {
            setError(`Failed to delete pod: ${error.message}`)
            setShowDeleteConfirm(false)
        }
    })

    const handleEdit = useCallback(async (pod: PodStatus) => {
        setError(null);

        try {
            const yaml = await utils.podRouter.getPodYaml.fetch({
                namespace: pod.namespace,
                name: pod.name
            });

            if (!yaml) {
                setError("No YAML configuration available for this pod");
            }

            setPodToEdit({ ...pod, yaml: yaml || pod.yaml || "" });
            setShowEditPodModal(true);
        } catch (err) {
            setError("Failed to fetch pod YAML for editing");
            console.error(err)
        }
    }, [utils])

    const handleDelete = useCallback((pod: PodStatus) => {
        setPodToDelete(pod)
        setShowDeleteConfirm(true)
    }, [])

    const confirmDelete = useCallback(async () => {
        if (!podToDelete) return

        try {
            await deletePod({
                namespace: podToDelete.namespace,
                name: podToDelete.name
            })
        } catch (err) {
            console.error("Failed to delete pod:", err)
        }
    }, [podToDelete, deletePod])

    const columns = createColumns({
        availableNamespaces,
        availableStatuses,
        onEdit: handleEdit,
        onDelete: handleDelete
    });

    useEffect(() => {
        if (podsQuery.data) {
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
        }
    }, [podsQuery.data]);

    const listTotal = podsQuery.data?.total ?? 0;
    const listTotalPages = podsQuery.data?.totalPages ?? 0;
    const listPage = podsQuery.data?.page ?? pagination.page;

    usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
        setPagination((prev) => ({ ...prev, page }))
    );

    const handleRefresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await podsQuery.refetch();
        } catch (err) {
            setError("Failed to refresh pods")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [podsQuery])

    const handlePodClick = useCallback(async (pod: PodStatus) => {
        setError(null);

        try {
            const yaml = await utils.podRouter.getPodYaml.fetch({
                namespace: pod.namespace,
                name: pod.name
            });
            setSelectedPod({ ...pod, yaml: yaml || "" });
            setShowPodDetails(true);
        } catch (err) {
            setError("Failed to fetch pod YAML");
            console.error(err)
        }
    }, [utils])

    const handlePodCreate = () => {
        setShowCreatePodModal(true)
    }

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
                            data={pods || []}
                            onRowClick={handlePodClick}
                            disablePagination={true}
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

            {podToEdit && (
                <PodEditDialog
                    open={showEditPodModal}
                    setOpen={setShowEditPodModal}
                    handleRefresh={handleRefresh}
                    podName={podToEdit.name}
                    podNamespace={podToEdit.namespace}
                    initialYaml={podToEdit.yaml || ""}
                />
            )}

            <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
                if (!isDeleting) setShowDeleteConfirm(open)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Pod</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete the pod <strong>{podToDelete?.name}</strong> in namespace <strong>{podToDelete?.namespace}</strong>?</p>
                        <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CreatePodDialog open={showCreatePodModal} setOpen={setShowCreatePodModal} handleRefresh={handleRefresh} />
        </div>
    )
}
