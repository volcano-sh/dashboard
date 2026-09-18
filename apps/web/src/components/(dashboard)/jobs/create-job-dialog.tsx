"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { load, YAMLException } from "js-yaml"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { validateJobManifest } from "@/lib/job-validation"
import { trpc } from "@volcano/trpc/react"

const defaultJobYaml = `apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: test-job
  namespace: default
spec:
  minAvailable: 1
  schedulerName: volcano
  queue: default
  tasks:
    - replicas: 1
      name: "default-nginx"
      template:
        spec:
          containers:
            - image: nginx
              imagePullPolicy: IfNotPresent
              name: nginx
              resources:
                requests:
                  cpu: "1"
          restartPolicy: OnFailure`

const jobWithVolumesYaml = `apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: test-job-with-volumes
  namespace: default
spec:
  minAvailable: 1
  schedulerName: volcano
  queue: default
  volumes:
    - mountPath: "/data"
      volumeClaim:
        accessModes: [ "ReadWriteOnce" ]
        storageClassName: "standard"
        resources:
          requests:
            storage: 1Gi
  tasks:
    - replicas: 1
      name: "worker"
      template:
        spec:
          containers:
            - image: nginx
              name: nginx
          restartPolicy: OnFailure`

export function CreateJobDialog({ open, setOpen, handleRefresh }: { open: boolean, setOpen: (open: boolean) => void, handleRefresh: () => void }) {
    const t = useTranslations("jobs")
    const tc = useTranslations("common")
    const [yaml, setYaml] = React.useState(defaultJobYaml)
    const [status, setStatus] = React.useState<{
        type: "success" | "error" | null
        message: string
    }>({ type: null, message: "" })

    React.useEffect(() => {
        if (open) {
            setStatus({ type: null, message: "" })
        }
    }, [open])

    const { mutateAsync: createJob, isPending: isCreating } = trpc.jobsRouter.createJob.useMutation({
        onSuccess: () => {
            setStatus({
                type: "success",
                message: t("create.success"),
            })

            setOpen(false)
            handleRefresh()
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

            const requiredFields = ['apiVersion', 'kind', 'metadata', 'spec']
            const missingFields = requiredFields.filter(field => !(field in parsed))

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
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

            if (!parsed.spec.tasks || !Array.isArray(parsed.spec.tasks)) {
                throw new Error('Job spec must include tasks array')
            }

            if (parsed.spec.tasks.length === 0) {
                throw new Error('Job spec must include at least one task')
            }

            const jobError = validateJobManifest(parsed)
            if (jobError) {
                throw new Error(jobError)
            }

            return parsed
        } catch (error) {
            if (error instanceof YAMLException) {
                throw new Error(`YAML parsing error: ${error.message}`)
            }
            throw error
        }
    }

    const handleCreateJob = async () => {
        try {
            const jobManifest = parseYamlToManifest(yaml)
            await createJob({ jobManifest })
        } catch (error) {
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : t("create.failed")
            })
        }
    }

    const handleReset = () => {
        setYaml(defaultJobYaml)
        setStatus({ type: null, message: "" })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t("create.title")}</DialogTitle>
                    <DialogDescription>{t("create.description")}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-hidden">
                    <div className="space-y-2">
                        <Label htmlFor="yaml-input">{t("create.yamlLabel")}</Label>
                        <Textarea
                            id="yaml-input"
                            value={yaml}
                            onChange={(e) => setYaml(e.target.value)}
                            placeholder={t("create.yamlPlaceholder")}
                            className="min-h-[400px] font-mono text-sm resize-none"
                            disabled={isCreating}
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            setYaml(jobWithVolumesYaml)
                            setStatus({ type: null, message: "" })
                        }}
                        disabled={isCreating}
                    >
                        Example with volumes
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={isCreating}>
                        {tc("actions.reset")}
                    </Button>
                    <Button onClick={handleCreateJob} disabled={isCreating || !yaml.trim()}>
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                                {tc("actions.creating")}
                            </>
                        ) : (
                            t("create.button")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
