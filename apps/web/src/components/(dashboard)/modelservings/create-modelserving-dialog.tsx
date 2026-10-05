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
import { trpc } from "@volcano/trpc/react"

const defaultModelServingYaml = `apiVersion: workload.serving.volcano.sh/v1alpha1
kind: ModelServing
metadata:
  name: demo-modelserving
  namespace: default
spec:
  schedulerName: volcano
  replicas: 1
  template:
    roles:
      - name: decode
        replicas: 1
        entryTemplate:
          spec:
            containers:
              - name: vllm
                image: ghcr.io/llm-d/llm-d-inference-sim:latest
                imagePullPolicy: IfNotPresent
                args:
                  - --model=demo
                  - --served-model-name=demo
                  - --port=8000
                  - --mode=echo
                ports:
                  - containerPort: 8000
`

export function CreateModelServingDialog({
    open,
    setOpen,
    handleRefresh,
}: {
    open: boolean
    setOpen: (open: boolean) => void
    handleRefresh: () => void
}) {
    const t = useTranslations("modelservings")
    const tc = useTranslations("common")
    const [yaml, setYaml] = React.useState(defaultModelServingYaml)
    const [status, setStatus] = React.useState<{
        type: "success" | "error" | null
        message: string
    }>({ type: null, message: "" })

    React.useEffect(() => {
        if (open) {
            setStatus({ type: null, message: "" })
        }
    }, [open])

    const { mutateAsync: createModelServing, isPending: isCreating } =
        trpc.modelServingsRouter.createModelServing.useMutation({
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

            if (!parsed || typeof parsed !== "object") {
                throw new Error("Invalid YAML: must be an object")
            }

            const requiredFields = ["apiVersion", "kind", "metadata", "spec"]
            const missingFields = requiredFields.filter((field) => !(field in parsed))

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
            }

            if (parsed.kind !== "ModelServing") {
                throw new Error('Kind must be "ModelServing"')
            }

            if (parsed.apiVersion !== "workload.serving.volcano.sh/v1alpha1") {
                throw new Error('apiVersion must be "workload.serving.volcano.sh/v1alpha1"')
            }

            if (!parsed.metadata || typeof parsed.metadata !== "object") {
                throw new Error("Invalid metadata: must be an object")
            }

            if (!parsed.metadata.name || typeof parsed.metadata.name !== "string") {
                throw new Error("Missing required field: metadata.name")
            }

            if (!parsed.spec || typeof parsed.spec !== "object") {
                throw new Error("Invalid spec: must be an object")
            }

            return parsed
        } catch (error) {
            if (error instanceof YAMLException) {
                throw new Error(`YAML parsing error: ${error.message}`)
            }
            throw error
        }
    }

    const handleCreate = async () => {
        try {
            const manifest = parseYamlToManifest(yaml)
            await createModelServing({ manifest })
        } catch (error) {
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : t("create.failed"),
            })
        }
    }

    const handleReset = () => {
        setYaml(defaultModelServingYaml)
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
                    <Button variant="outline" onClick={handleReset} disabled={isCreating}>
                        {tc("actions.reset")}
                    </Button>
                    <Button onClick={handleCreate} disabled={isCreating || !yaml.trim()}>
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
