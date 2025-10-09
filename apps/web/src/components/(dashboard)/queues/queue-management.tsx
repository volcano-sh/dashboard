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
import { trpc } from "@volcano/trpc/react"
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "../data-table"
import { createColumns } from "./columns"
import { CreateQueueDialog } from "./create-queue-dialog"
import { QueueEditDialog } from "./queue-edit-dialog"

export type QueueStatus = {
    name: string;
    createdAt: Date;
    state: string;
    parent: string;
    yaml?: string;
}

export default function QueueManagement() {
    const [queues, setQueues] = useState<QueueStatus[]>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedQueue, setSelectedQueue] = useState<QueueStatus | null>(null)
    const [showQueueDetails, setShowQueueDetails] = useState(false)
    const [showCreateQueueModal, setShowCreateQueueModal] = useState(false)
    const [showEditQueueModal, setShowEditQueueModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [queueToEdit, setQueueToEdit] = useState<QueueStatus | null>(null)
    const [queueToDelete, setQueueToDelete] = useState<QueueStatus | null>(null)
    const [totalQueues, setTotalQueues] = useState(0)

    const utils = trpc.useUtils()

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
    })

    const queuesQuery = trpc.queueRouter.getQueues.useQuery(
        {
            page: pagination.page,
            pageSize: pagination.pageSize,
        },
        {
            keepPreviousData: true,
            onError: (err) => {
                console.error("Error fetching queues:", err);
                setError(`Queues API error: ${err.message}`);
            },
        }
    )

    const { mutateAsync: deleteQueue, isPending: isDeleting } = trpc.queueRouter.deleteQueue.useMutation({
        onSuccess: async () => {
            const deletedQueueName = queueToDelete?.name
            setShowDeleteConfirm(false)

            if (queueToDelete) {
                setQueues(prevQueues =>
                    prevQueues?.filter(q => q.name !== queueToDelete.name)
                )
                setTotalQueues(prev => Math.max(0, prev - 1))
            }

            setQueueToDelete(null)
            setError(null)

            setTimeout(async () => {
                await handleRefresh()
            }, 2000)

            console.log(`Queue "${deletedQueueName}" deleted successfully`)
        },
        onError: (error) => {
            let errorMessage = error.message

            if (errorMessage.includes('root') && errorMessage.includes('can not be deleted')) {
                errorMessage = "The 'root' queue is a system queue and cannot be deleted."
            } else if (errorMessage.includes('denied the request')) {
                const match = errorMessage.match(/denied the request: (.+?)(?:"|$)/)
                if (match && match[1]) {
                    errorMessage = match[1]
                }
            }

            setError(`Failed to delete queue: ${errorMessage}`)
            setShowDeleteConfirm(false)
        }
    })

    const handleEdit = useCallback(async (queue: QueueStatus) => {
        setError(null);

        try {
            // Fetch YAML with explicit parameters using tRPC utils
            const yaml = await utils.queueRouter.getQueueYaml.fetch({
                name: queue.name
            });

            if (!yaml) {
                setError("No YAML configuration available for this queue");
            }

            setQueueToEdit({ ...queue, yaml: yaml || queue.yaml || "" });
            setShowEditQueueModal(true);
        } catch (err) {
            setError("Failed to fetch queue YAML for editing");
            console.error(err)
        }
    }, [utils])

    const handleDelete = useCallback((queue: QueueStatus) => {
        setQueueToDelete(queue)
        setShowDeleteConfirm(true)
    }, [])

    const confirmDelete = useCallback(async () => {
        if (!queueToDelete) return

        try {
            await deleteQueue({
                name: queueToDelete.name
            })
        } catch (err) {
            console.error("Failed to delete queue:", err)
        }
    }, [queueToDelete, deleteQueue])

    const columns = createColumns({
        onEdit: handleEdit,
        onDelete: handleDelete
    })

    const queueYamlQuery = trpc.queueRouter.getQueueYaml.useQuery(
        { name: selectedQueue?.name || "" },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching queue YAML:", err);
                setError(`Queue YAML API error: ${err.message}`);
            },
        },
    );

    useEffect(() => {
        if (queuesQuery.data) {
            const transformedQueues: QueueStatus[] = (queuesQuery.data.items || []).map((queue: any) => ({
                name: queue.metadata?.name || '',
                createdAt: new Date(queue.metadata?.creationTimestamp || Date.now()),
                state: queue.status?.state?.toLowerCase() || 'unknown',
                parent: queue.spec?.parent || 'root',
                yaml: queue.yaml || '',
            }));

            setQueues(transformedQueues);
            setTotalQueues(queuesQuery.data.totalCount || 0);
        }
    }, [queuesQuery.data]);

    const handleRefresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await queuesQuery.refetch();
        } catch (err) {
            setError("Failed to refresh queues")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [queuesQuery])

    const handleQueueClick = useCallback(async (queue: QueueStatus) => {
        setError(null);

        try {
            const response = await queueYamlQuery.refetch();
            const yaml = response.data || queue.yaml || "";
            setSelectedQueue({ ...queue, yaml });
            setShowQueueDetails(true);
        } catch (err) {
            setError("Failed to fetch queue YAML");
            console.error(err)
        }
    }, [queueYamlQuery])

    const handleCreateQueue = () => {
        setShowCreateQueueModal(true)
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

    const getStateColor = (state: string) => {
        switch (state) {
            case "open":
                return "bg-green-100 text-green-800"
            case "closed":
                return "bg-red-100 text-red-800"
            case "maintenance":
                return "bg-yellow-100 text-yellow-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const isLoading = queuesQuery.isLoading
    const isRefreshing = queuesQuery.isRefetching

    const totalPages = Math.ceil(totalQueues / pagination.pageSize);
    const startItem = (pagination.page - 1) * pagination.pageSize + 1;
    const endItem = Math.min(pagination.page * pagination.pageSize, totalQueues);

    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Queue Management</h1>
                <div className="flex items-center">
                    <Button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2 mr-4"
                    >
                        <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleCreateQueue} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Queue
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
                            data={queues || []}
                            onRowClick={handleQueueClick}
                            disablePagination={true}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            Showing {startItem} to {endItem} of {totalQueues} results
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

            <Dialog open={showQueueDetails} onOpenChange={setShowQueueDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Queue Details: {selectedQueue?.name}
                            {selectedQueue && (
                                <Badge className={getStateColor(selectedQueue.state)}>
                                    {selectedQueue.state}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedQueue && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-semibold">Name:</span> {selectedQueue.name}
                                </div>
                                <div>
                                    <span className="font-semibold">Created:</span> {selectedQueue.createdAt.toLocaleString()}
                                </div>
                                <div>
                                    <span className="font-semibold">State:</span>
                                    <Badge className={`ml-2 ${getStateColor(selectedQueue.state)}`}>
                                        {selectedQueue.state}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">YAML Configuration</h3>
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{selectedQueue.yaml}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {queueToEdit && (
                <QueueEditDialog
                    open={showEditQueueModal}
                    setOpen={setShowEditQueueModal}
                    handleRefresh={handleRefresh}
                    queueName={queueToEdit.name}
                    initialYaml={queueToEdit.yaml || ""}
                />
            )}

            <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
                if (!isDeleting) setShowDeleteConfirm(open)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Queue</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete the queue <strong>{queueToDelete?.name}</strong>?</p>
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

            <CreateQueueDialog open={showCreateQueueModal} setOpen={setShowCreateQueueModal} handleRefresh={handleRefresh} />
        </div>
    )
}