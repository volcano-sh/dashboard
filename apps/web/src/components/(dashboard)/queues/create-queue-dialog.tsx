"use client"
import { dump } from "js-yaml"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { validateQueueResources } from "@/lib/queue-validation"
import { cn } from "@/lib/utils"
import { trpc } from "@volcano/trpc/react"

import {
  applyManifestToForm,
  buildManifestFromForm,
  dumpOpts,
  emptyResource,
  parseQueueYaml,
  QueueFormFields,
  type ResourcePair
} from "./queue-form-shared"

const defaultQueueYaml = `apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: my-queue
spec:
  capability:
    cpu: "8"
    memory: 16Gi
  deserved:
    cpu: "4"
    memory: 8Gi
  guarantee:
    resource:
      cpu: "2"
      memory: 4Gi
  priority: 100
  reclaimable: true
  weight: 1`

export function CreateQueueDialog({
  open,
  setOpen,
  handleRefresh
}: {
  open: boolean
  setOpen: (open: boolean) => void
  handleRefresh: () => void
}) {
  const t = useTranslations("queues")
  const tc = useTranslations("common")
  const [mode, setMode] = React.useState<"form" | "yaml">("form")
  const [queueName, setQueueName] = React.useState("")
  const [weight, setWeight] = React.useState("1")
  const [priority, setPriority] = React.useState("100")
  const [reclaimable, setReclaimable] = React.useState(true)
  const [guarantee, setGuarantee] = React.useState<ResourcePair>(() => emptyResource())
  const [capability, setCapability] = React.useState<ResourcePair>(() => emptyResource())
  const [deserved, setDeserved] = React.useState<ResourcePair>(() => emptyResource())
  const [yaml, setYaml] = React.useState(defaultQueueYaml)
  const [status, setStatus] = React.useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const resetForm = React.useCallback(() => {
    setQueueName("")
    setWeight("1")
    setPriority("100")
    setReclaimable(true)
    setGuarantee(emptyResource())
    setCapability(emptyResource())
    setDeserved(emptyResource())
  }, [])

  React.useEffect(() => {
    if (open) {
      setStatus({ type: null, message: "" })
      setMode("form")
      setYaml(defaultQueueYaml)
      resetForm()
    }
  }, [open, resetForm])

  const { mutateAsync: createQueue, isPending: isCreating } = trpc.queueRouter.createQueue.useMutation({
    onSuccess: () => {
      setStatus({ type: "success", message: t("create.success") })
      setOpen(false)
      handleRefresh()
    },
    onError: (error) => {
      setStatus({ type: "error", message: error.message })
    }
  })

  const parseYamlToManifest = React.useCallback((yamlString: string) => {
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

      if (parsed.kind !== "Queue") {
        throw new Error('Kind must be "Queue"')
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
  }, [])

  // Form → YAML while on Form tab (YAML stays ready when you switch views)
  React.useEffect(() => {
    if (!open || mode !== "form") return
    try {
      const m = buildManifestFromForm({
        name: queueName,
        weight,
        priority,
        reclaimable,
        guarantee,
        capability,
        deserved
      })
      const nextYaml = dump(m, dumpOpts)
      setYaml((prev) => (prev === nextYaml ? prev : nextYaml))
    } catch {
      /* incomplete form */
    }
  }, [open, mode, queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  React.useEffect(() => {
    if (!open || mode !== "yaml") return
    const id = window.setTimeout(() => {
      try {
        const m = parseQueueYaml(yaml)
        applyManifestToForm(m, {
          setQueueName,
          setWeight,
          setPriority,
          setReclaimable,
          setGuarantee,
          setCapability,
          setDeserved
        })
      } catch {
        /* invalid YAML */
      }
    }, 350)
    return () => window.clearTimeout(id)
  }, [open, mode, yaml])

  const goForm = React.useCallback(() => {
    try {
      const m = parseQueueYaml(yaml)
      applyManifestToForm(m, {
        setQueueName,
        setWeight,
        setPriority,
        setReclaimable,
        setGuarantee,
        setCapability,
        setDeserved
      })
      setStatus({ type: null, message: "" })
      setMode("form")
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : t("create.parseFormFailed")
      })
    }
  }, [yaml])

  const goYaml = React.useCallback(() => {
    try {
      const m = buildManifestFromForm({
        name: queueName,
        weight,
        priority,
        reclaimable,
        guarantee,
        capability,
        deserved
      })
      setYaml(dump(m, dumpOpts))
      setStatus({ type: null, message: "" })
      setMode("yaml")
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Complete the form before switching to YAML"
      })
    }
  }, [queueName, weight, priority, reclaimable, guarantee, capability, deserved])

  const handleCreateQueue = async () => {
    try {
      const queueManifest =
        mode === "form"
          ? buildManifestFromForm({
              name: queueName,
              weight,
              priority,
              reclaimable,
              guarantee,
              capability,
              deserved
            })
          : parseQueueYaml(yaml)
      await createQueue({ queueManifest })
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : t("create.failed")
      })
    }
  }

  const handleReset = () => {
    setYaml(defaultQueueYaml)
    resetForm()
    setStatus({ type: null, message: "" })
  }

  const handleGuaranteeChange = React.useCallback((next: ResourcePair) => {
    setGuarantee(next)
    setDeserved((prev) => ({
      cpu: prev.cpu.trim() ? prev.cpu : next.cpu,
      memory: prev.memory.trim() ? prev.memory : next.memory
    }))
  }, [])

  const resourceValidation = React.useMemo(
    () => validateQueueResources(guarantee, capability, deserved),
    [guarantee, capability, deserved]
  )

  const formDisabled =
    !queueName.trim() || !weight.trim() || (mode === "form" && !resourceValidation.valid)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-h-[85vh] flex flex-col",
          mode === "yaml" ? "max-w-4xl" : "max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          <Button type="button" variant={mode === "form" ? "default" : "outline"} size="sm" onClick={goForm}>
            {t("create.formTab")}
          </Button>
          <Button type="button" variant={mode === "yaml" ? "default" : "outline"} size="sm" onClick={goYaml}>
            {t("create.yamlTab")}
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {mode === "form" ? (
            <QueueFormFields
              queueName={queueName}
              onQueueNameChange={setQueueName}
              weight={weight}
              onWeightChange={setWeight}
              priority={priority}
              onPriorityChange={setPriority}
              reclaimable={reclaimable}
              onReclaimableChange={setReclaimable}
              guarantee={guarantee}
              onGuaranteeChange={handleGuaranteeChange}
              capability={capability}
              onCapabilityChange={setCapability}
              deserved={deserved}
              onDeservedChange={setDeserved}
              disabled={isCreating}
              resourceValidation={resourceValidation}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="yaml-input">{t("create.yamlLabel")}</Label>
              <Textarea
                id="yaml-input"
                value={yaml}
                onChange={(e) => setYaml(e.target.value)}
                placeholder={t("create.yamlPlaceholder")}
                className="min-h-[360px] font-mono text-sm resize-none"
                disabled={isCreating}
              />
            </div>
          )}

          {status.type && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            {tc("actions.cancel")}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isCreating}>
            {tc("actions.reset")}
          </Button>
          <Button
            onClick={handleCreateQueue}
            disabled={isCreating || (mode === "yaml" ? !yaml.trim() : formDisabled)}
          >
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

function ResourceCollapsible({
  title,
  pair,
  onChange,
  disabled,
  helper
}: {
  title: string
  pair: ResourcePair
  onChange: (p: ResourcePair) => void
  disabled: boolean
  helper: string
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-muted/60"
        type="button"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border border-t-0 border-border rounded-b-md p-3">
        <p className="text-xs text-muted-foreground">{helper}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">CPU</Label>
            <Input
              placeholder='e.g. "2"'
              value={pair.cpu}
              onChange={(e) => onChange({ ...pair, cpu: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Memory</Label>
            <Input
              placeholder="e.g. 4Gi"
              value={pair.memory}
              onChange={(e) => onChange({ ...pair, memory: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
