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

interface JobEditDialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    handleRefresh: () => void
    jobName: string
    jobNamespace: string
    initialYaml: string
}

export function JobEditDialog({ open, setOpen, handleRefresh, jobName, jobNamespace, initialYaml }: JobEditDialogProps) {
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

    const { mutateAsync: updateJob, isPending: isUpdating } = trpc.jobsRouter.updateJob.useMutation({
        onSuccess: () => {
            setStatus({
                type: "success",
                message: "Job updated successfully!",
            })

            setTimeout(() => {
                setOpen(false)
                handleRefresh()
            }, 1000)
        },
        onError: (error) => {
            setStatus({
                type: "error",
                message: error.message,
            })
        },
    })

    const parseYamlToManifest = (yamlString: string) => {
        try {
            const parsed = load(yamlString) as any

            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid YAML: must be an object')
            }

            if (parsed.kind !== 'Job') {
                throw new Error('Kind must be "Job"')
            }

            if (!parsed.metadata || typeof parsed.metadata !== 'object') {
                throw new Error('Invalid metadata: must be an object')
            }

            if (!parsed.metadata.name || typeof parsed.metadata.name !== 'string') {
                throw new Error('Missing required field: metadata.name')
            }

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

    const handleUpdateJob = async () => {
        try {
            const jobManifest = parseYamlToManifest(yaml)
            await updateJob({
                namespace: jobNamespace,
                name: jobName,
                patchData: jobManifest
            })
        } catch (error) {
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : "Failed to update job"
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
                    <DialogTitle>Edit Job: {jobName}</DialogTitle>
                    <DialogDescription>
                        The current job configuration is shown below. Make your changes and click Update to apply them.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-hidden">
                    <div className="space-y-2">
                        <Label htmlFor="yaml-input">Job YAML Configuration</Label>
                        <Textarea
                            id="yaml-input"
                            value={yaml}
                            onChange={(e) => setYaml(e.target.value)}
                            placeholder="Enter your job YAML configuration..."
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
                    <Button onClick={handleUpdateJob} disabled={isUpdating || !yaml.trim()}>
                        {isUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Job"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

