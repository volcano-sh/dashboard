"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { load, YAMLException } from "js-yaml"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@volcano/trpc/react"

interface PodEditDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    handleRefresh: () => void
    podName: string
    podNamespace: string
    initialYaml: string
}

export function PodEditDialog({ open, setOpen, handleRefresh, podName, podNamespace, initialYaml }: PodEditDialogProps) {
    const [yaml, setYaml] = React.useState(initialYaml)
    const [status, setStatus] = React.useState<{
        type: "success" | "error" | null
        message: string
    }>({ type: null, message: "" })

    React.useEffect(() => {
        if (open) {
            setYaml(initialYaml)
            setStatus({ type: null, message: "" })
        }
    }, [open, initialYaml])

    const { mutateAsync: updatePod, isPending: isUpdating } = trpc.podRouter.updatePod.useMutation({
        onSuccess: () => {
            setStatus({
                type: "success",
                message: "Pod updated successfully!",
            })

            setTimeout(() => {
                setOpen(false)
                handleRefresh()
            }, 1000)
        },
        onError: (error) => {
            let errorMessage = error.message

            // Parse Kubernetes API error messages for better UX
            if (errorMessage.includes('pod updates may not change fields')) {
                errorMessage = "Cannot update this field. Running pods only allow changes to: container images, imagePullPolicy, activeDeadlineSeconds, and tolerations. For other changes, please delete and recreate the pod."
            } else if (errorMessage.includes('Forbidden')) {
                const match = errorMessage.match(/Forbidden: (.+?)(?:\n|$)/)
                if (match && match[1]) {
                    errorMessage = match[1]
                }
            }

            setStatus({
                type: "error",
                message: errorMessage,
            })
        },
    })

    const parseYamlToManifest = (yamlString: string) => {
        try {
            // Parse YAML using js-yaml library
            const parsed = load(yamlString) as any

            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid YAML: must be an object')
            }

            // Validate kind
            if (parsed.kind !== 'Pod') {
                throw new Error('Kind must be "Pod"')
            }

            // Validate metadata
            if (!parsed.metadata || typeof parsed.metadata !== 'object') {
                throw new Error('Invalid metadata: must be an object')
            }

            if (!parsed.metadata.name || typeof parsed.metadata.name !== 'string') {
                throw new Error('Missing required field: metadata.name')
            }

            // Validate spec
            if (!parsed.spec || typeof parsed.spec !== 'object') {
                throw new Error('Invalid spec: must be an object')
            }

            return parsed
        } catch (error) {
            if (error instanceof YAMLException) {
                throw new Error(`YAML parsing error: ${error.message}`)
            }
            throw error
        }
    }

    const handleUpdatePod = async () => {
        try {
            const podManifest = parseYamlToManifest(yaml)
            await updatePod({
                namespace: podNamespace,
                name: podName,
                patchData: podManifest
            })
        } catch (error) {
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : "Failed to update pod"
            })
        }
    }

    const handleReset = () => {
        setYaml(initialYaml)
        setStatus({ type: null, message: "" })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Pod: {podName}</DialogTitle>
                    <DialogDescription>
                        The current pod configuration is shown below. Make your changes and click Update to apply them.
                    </DialogDescription>
                </DialogHeader>

                <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-sm">
                        <strong>Note:</strong> Running pods have limited editability. You can only modify:
                        <ul className="list-disc ml-4 mt-1">
                            <li>Container images (<code>spec.containers[*].image</code>)</li>
                            <li>Init container images (<code>spec.initContainers[*].image</code>)</li>
                            <li>Active deadline seconds</li>
                            <li>Tolerations (additions only)</li>
                        </ul>
                        For other changes, delete and recreate the pod.
                    </AlertDescription>
                </Alert>

                <div className="flex-1 space-y-4 overflow-hidden">
                    <div className="space-y-2">
                        <Label htmlFor="yaml-input">Pod YAML Configuration</Label>
                        <Textarea
                            id="yaml-input"
                            value={yaml}
                            onChange={(e) => setYaml(e.target.value)}
                            placeholder="Enter your pod YAML configuration..."
                            className="min-h-[400px] font-mono text-sm resize-none"
                            disabled={isUpdating}
                        />
                    </div>

                    {status.type && (
                        <Alert variant={status.type === "error" ? "destructive" : "default"}>
                            {status.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertDescription>{status.message}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleReset} disabled={isUpdating}>
                        Reset
                    </Button>
                    <Button onClick={handleUpdatePod} disabled={isUpdating || !yaml.trim()}>
                        {isUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Pod"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

