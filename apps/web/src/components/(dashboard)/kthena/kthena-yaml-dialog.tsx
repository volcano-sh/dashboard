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

type Props = {
    open: boolean
    setOpen: (open: boolean) => void
    handleRefresh: () => void
    messageNamespace: string
    kind: string
    apiVersion: string
    defaultYaml: string
    mode: "create" | "edit"
    name?: string
    namespace?: string
    initialYaml?: string
    onCreate?: (manifest: Record<string, unknown>) => Promise<void>
    onUpdate?: (args: {
        namespace: string
        name: string
        patchData: Record<string, unknown>
    }) => Promise<void>
}

export function KthenaYamlDialog({
    open,
    setOpen,
    handleRefresh,
    messageNamespace,
    kind,
    apiVersion,
    defaultYaml,
    mode,
    name = "",
    namespace = "",
    initialYaml = "",
    onCreate,
    onUpdate,
}: Props) {
    const t = useTranslations(messageNamespace)
    const tc = useTranslations("common")
    const [yaml, setYaml] = React.useState(mode === "edit" ? initialYaml : defaultYaml)
    const [status, setStatus] = React.useState<{
        type: "success" | "error" | null
        message: string
    }>({ type: null, message: "" })
    const [pending, setPending] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setYaml(mode === "edit" ? initialYaml : defaultYaml)
            setStatus({ type: null, message: "" })
        }
    }, [open, initialYaml, defaultYaml, mode])

    const parseYamlToManifest = (yamlString: string) => {
        try {
            const parsed = load(yamlString) as any
            if (!parsed || typeof parsed !== "object") {
                throw new Error("Invalid YAML: must be an object")
            }
            if (parsed.kind !== kind) {
                throw new Error(`Kind must be "${kind}"`)
            }
            if (parsed.apiVersion !== apiVersion) {
                throw new Error(`apiVersion must be "${apiVersion}"`)
            }
            if (!parsed.metadata?.name || typeof parsed.metadata.name !== "string") {
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

    const handleSubmit = async () => {
        try {
            setPending(true)
            const manifest = parseYamlToManifest(yaml)
            if (mode === "create") {
                await onCreate?.(manifest)
            } else {
                await onUpdate?.({ namespace, name, patchData: manifest })
            }
            setStatus({
                type: "success",
                message: t(mode === "create" ? "create.success" : "edit.success"),
            })
            if (mode === "create") {
                setOpen(false)
                handleRefresh()
            } else {
                setTimeout(() => {
                    setOpen(false)
                    handleRefresh()
                }, 1000)
            }
        } catch (error) {
            setStatus({
                type: "error",
                message: error instanceof Error
                    ? error.message
                    : t(mode === "create" ? "create.failed" : "edit.failed"),
            })
        } finally {
            setPending(false)
        }
    }

    const handleReset = () => {
        setYaml(mode === "edit" ? initialYaml : defaultYaml)
        setStatus({ type: null, message: "" })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? t("create.title") : t("edit.title", { name })}
                    </DialogTitle>
                    <DialogDescription>
                        {t(mode === "create" ? "create.description" : "edit.description")}
                    </DialogDescription>
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
                            disabled={pending}
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
                    <Button variant="outline" onClick={handleReset} disabled={pending}>
                        {tc("actions.reset")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={pending || !yaml.trim()}>
                        {pending ? (
                            <>
                                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                                {mode === "create" ? tc("actions.creating") : tc("actions.updating")}
                            </>
                        ) : (
                            t(mode === "create" ? "create.button" : "edit.button")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
