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
import { ListPagination } from "../list-pagination"
import { useCallback, useEffect, useState } from "react"
import { DataTable } from "../data-table"
import { ServerPagination } from "../server-pagination"
import { useQueueColumns } from "./columns"
import { isProtectedQueue, protectedQueueDeleteMessage } from "@/lib/queue-constants"
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
    const t = useTranslations("queues")
    const tc = useTranslations("common")
    const format = useFormatter()
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
                setError(t("errors.api", { message: err.message }));
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

            if (
                errorMessage.includes("can not be delete") ||
                errorMessage.includes("cannot be delete")
            ) {
                const queueName = queueToDelete?.name ?? "system"
                errorMessage = protectedQueueDeleteMessage(queueName)
            } else if (errorMessage.includes('denied the request')) {
                const match = errorMessage.match(/denied the request: (.+?)(?:"|$)/)
                if (match && match[1]) {
                    errorMessage = match[1]
                }
            }

            setError(t("errors.delete", { message: errorMessage }))
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
                setError(t("errors.noYaml"));
            }

            setQueueToEdit({ ...queue, yaml: yaml || queue.yaml || "" });
            setShowEditQueueModal(true);
        } catch (err) {
            setError(t("errors.fetchYamlEdit"));
            console.error(err)
        }
    }, [utils])

    const handleDelete = useCallback((queue: QueueStatus) => {
        if (isProtectedQueue(queue.name)) {
            setError(protectedQueueDeleteMessage(queue.name))
            return
        }
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

    const columns = useQueueColumns({
        onEdit: handleEdit,
        onDelete: handleDelete
    })

    const queueYamlQuery = trpc.queueRouter.getQueueYaml.useQuery(
        { name: selectedQueue?.name || "" },
        {
            enabled: false,
            onError: (err) => {
                console.error("Error fetching queue YAML:", err);
                setError(t("errors.yamlApi", { message: err.message }));
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
        }
    }, [queuesQuery.data]);

    const listTotal = queuesQuery.data?.total ?? 0;
    const listTotalPages = queuesQuery.data?.totalPages ?? 0;
    const listPage = queuesQuery.data?.page ?? pagination.page;

    usePaginationClamp(listTotal, pagination.page, pagination.pageSize, (page) =>
        setPagination((prev) => ({ ...prev, page }))
    );

    const handleRefresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await queuesQuery.refetch();
        } catch (err) {
            setError(t("errors.refresh"))
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
            setError(t("errors.fetchYaml"));
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

    return (
        <div className="container mx-auto p-4 mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t("title")}</h1>
                <div className="flex items-center">
                    <Button
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2 me-4"
                    >
                        <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
                        {tc("actions.refresh")}
                    </Button>
                    <Button onClick={handleCreateQueue} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t("createQueue")}
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

            <Dialog open={showQueueDetails} onOpenChange={setShowQueueDetails}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {t("details.title", { name: selectedQueue?.name ?? "" })}
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
                                    <span className="font-semibold">{tc("details.name")}</span> {selectedQueue.name}
                                </div>
                                <div>
                                    <span className="font-semibold">{tc("details.created")}</span>{" "}
                                    {format.dateTime(selectedQueue.createdAt, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </div>
                                <div>
                                    <span className="font-semibold">{tc("details.state")}</span>
                                    <Badge className={`ms-2 ${getStateColor(selectedQueue.state)}`}>
                                        {selectedQueue.state}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">{tc("details.yamlConfiguration")}</h3>
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
                        <DialogTitle>{t("delete.title")}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>{t("delete.message", { name: queueToDelete?.name ?? "" })}</p>
                        <p className="mt-2 text-sm text-gray-500">{tc("deleteConfirm.cannotUndo")}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                        >
                            {tc("actions.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 me-2 animate-spin" />
                                    {tc("actions.deleting")}
                                </>
                            ) : (
                                tc("actions.delete")
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateQueueDialog open={showCreateQueueModal} setOpen={setShowCreateQueueModal} handleRefresh={handleRefresh} />
        </div>
    )
}